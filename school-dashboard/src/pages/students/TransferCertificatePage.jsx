import { useState, useCallback } from 'react';
import {
  Button, Input, Checkbox, Breadcrumbs,
} from '../../components/ui';
import { FileText, Search, Home, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { PageLayout } from '../../components/ui';
import TCGeneratorModal from './TCGeneratorModal';
import toast from 'react-hot-toast';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { useTranslation } from 'react-i18next';
import '../../styles/student.css';

export default function TransferCertificatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { toast.error('Enter a name or admission number'); return; }
    setLoading(true);
    setSearched(true);
    setSelected(new Set());
    try {
      const res = await request(`/students?search=${encodeURIComponent(search.trim())}&limit=20&status=active`);
      const list = res?.students ?? res;
      setStudents(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to search students');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s._id)));
  };

  const selectedStudents = students.filter(s => selected.has(s._id));

  return (
    <div className="animate-fade-in tc-page">
      <Breadcrumbs
        size="sm"
        items={[
          { label: 'Home', href: '/', icon: <Home size={14} aria-hidden /> },
          { label: 'Students', href: '/students' },
          { label: 'Transfer Certificate' },
        ]}
      />

      <PageLayout
        header={{ title: 'Transfer Certificate', description: 'Search students and generate TC documents' }}
        noPadding
      >
        <div className="p-6 space-y-4">
          {/* Search bar */}
          <div className="tc-toolbar">
            <Input
              aria-label="Search students"
              placeholder={t('students.form.searchStudentPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              size="sm"
              startContent={<Search size={14} className="text-fg-faint" aria-hidden />}
              className="flex-1 max-w-md"
            />
            <Button
              size="sm"
              className="bg-fg text-bg"
              onClick={handleSearch}
              loading={loading}
            >
              Search
            </Button>
            <div style={{ flex: 1 }} />
            {students.length > 0 && (
              <>
                <span className="tc-toolbar__count">
                  <span className="mono tnum">{students.length}</span> result{students.length !== 1 ? 's' : ''} ·{' '}
                  <span className="mono tnum">{selected.size}</span> selected
                </span>
                <Button size="sm" variant="ghost" onClick={selectAll}>
                  {selected.size === students.length ? 'Clear' : 'Select all'}
                </Button>
                {selected.size > 0 && (
                  <Button
                    size="sm"
                    className="bg-fg text-bg"
                    icon={<Printer size={14} aria-hidden />}
                    onClick={() => setModalOpen(true)}
                  >
                    Generate TC (<span className="mono tnum">{selected.size}</span>)
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Results */}
          {loading && <TablePageSkeleton />}

          {!loading && searched && students.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border-token rounded-xl">
              <FileText size={36} className="mx-auto mb-3 text-fg-faint" aria-hidden />
              <p className="text-fg-muted">No students found for "{search}"</p>
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="tc-list-frame">
              {students.map(s => {
                const isSel = selected.has(s._id);
                const className = s.classId?.name || s.className || '—';
                const section = s.classId?.section ? ` (${s.classId.section})` : '';
                return (
                  <div
                    key={s._id}
                    onClick={() => toggleSelect(s._id)}
                    className={`tc-row ${isSel ? 'is-selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(s._id); } }}
                  >
                    <Checkbox
                      checked={isSel}
                      onChange={() => toggleSelect(s._id)}
                      size="sm"
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select ${s.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="tc-row__name">{s.name}</p>
                      <p className="tc-row__meta">
                        Adm: {s.admissionId || s.admissionNumber || '—'} ·
                        Roll: {s.rollNo || '—'} ·
                        Class: {className}{section}
                      </p>
                    </div>
                    <span className={`chip ${s.status === 'active' ? 'chip--ok' : ''}`}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !searched && (
            <div className="text-center py-20">
              <FileText size={44} className="mx-auto mb-4 text-fg-faint" aria-hidden />
              <p className="text-fg-muted">Search for students to generate Transfer Certificates</p>
            </div>
          )}
        </div>
      </PageLayout>

      <TCGeneratorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        students={selectedStudents}
      />
    </div>
  );
}
