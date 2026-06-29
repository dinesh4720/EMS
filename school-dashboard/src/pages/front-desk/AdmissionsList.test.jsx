/**
 * @vitest-environment jsdom
 *
 * Covers PAG-15: the admissions list now paginates server-side instead of
 * fetching every record and rendering it client-side.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '../../context/AppContext';

vi.mock(import('react-i18next'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }),
  };
});

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const getAdmissions = vi.fn();

vi.mock('../../services/api', () => ({
  frontDeskApi: {
    getAdmissions: (...args) => getAdmissions(...args),
    deleteAdmission: vi.fn(() => Promise.resolve({})),
    updateAdmission: vi.fn(() => Promise.resolve({})),
  },
  staffApi: { getAll: vi.fn(() => Promise.resolve([])) },
  classesApi: { getAll: vi.fn(() => Promise.resolve([])) },
}));

// Keep the test focused on the list/pagination wiring — stub the heavy children.
vi.mock('./AdmissionFormModal', () => ({ default: () => null }));
vi.mock('./AdmissionDetailModal', () => ({ default: () => null }));
vi.mock('./AdmissionTracker', () => ({
  default: ({ admissions }) => <div data-testid="board">{admissions.length} cards</div>,
}));

import AdmissionsList from './AdmissionsList';

const PAGE = [
  { _id: 'a1', studentName: 'Alice Apple', parentName: 'Anna', phoneNumber: '111', status: 'inquiry-logged' },
  { _id: 'a2', studentName: 'Bob Banana', parentName: 'Ben', phoneNumber: '222', status: 'admission-approved' },
];

const ENVELOPE = {
  data: PAGE,
  statusCounts: { all: 60, 'inquiry-logged': 40, 'admission-approved': 20 },
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalItems: 60,
    itemsPerPage: 25,
    hasNextPage: true,
    hasPrevPage: false,
  },
};

function renderList() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <AppProvider>
          <AdmissionsList />
        </AppProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('AdmissionsList — server-side pagination (PAG-15)', () => {
  beforeEach(() => {
    getAdmissions.mockReset();
    getAdmissions.mockImplementation((params) =>
      Promise.resolve(params?.limit === 0 ? { ...ENVELOPE, pagination: { ...ENVELOPE.pagination, itemsPerPage: 60, totalPages: 1 } } : ENVELOPE)
    );
  });
  afterEach(cleanup);

  it('requests a bounded page (page=1, limit=25) instead of fetching everything', async () => {
    renderList();
    await waitFor(() => expect(getAdmissions).toHaveBeenCalled());
    expect(getAdmissions).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 25 })
    );
    // The request must NOT be an unbounded fetch-all.
    const call = getAdmissions.mock.calls[0][0];
    expect(call.limit).toBe(25);
  });

  it('renders the rows returned by the server', async () => {
    renderList();
    expect(await screen.findByText('Alice Apple')).toBeTruthy();
    expect(screen.getByText('Bob Banana')).toBeTruthy();
  });

  it('drives stage-chip counts from the server statusCounts, not the loaded page', async () => {
    renderList();
    // "All" reflects the whole-school total (60), even though only 2 rows loaded.
    const allTab = await screen.findByRole('tab', { name: /All/i });
    expect(allTab.textContent).toContain('60');
  });

  it('shows the pagination control when more than one page exists', async () => {
    renderList();
    await screen.findByText('Alice Apple');
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('loads the full filtered set (limit=0) when the board view is opened', async () => {
    renderList();
    await screen.findByText('Alice Apple');

    fireEvent.click(screen.getByRole('tab', { name: /Board/i }));

    await waitFor(() =>
      expect(getAdmissions).toHaveBeenCalledWith(expect.objectContaining({ limit: 0 }))
    );
    expect(await screen.findByTestId('board')).toBeTruthy();
  });
});
