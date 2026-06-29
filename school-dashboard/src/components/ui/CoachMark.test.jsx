/**
 * @vitest-environment jsdom
 *
 * Regression test for MEM-16: the live-rect MutationObserver must observe the
 * coach-mark target's container subtree, NOT the whole document.body. Watching
 * all of body re-measured on every unrelated DOM mutation anywhere in the app.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import CoachMarks, { resetCoachMarks } from './CoachMark';

const SURFACE = 'mem16-test-surface';

// Captures the node passed to each MutationObserver.observe() call so the test
// can assert the observed root without depending on getBoundingClientRect.
let observedRoots;

function installMutationObserverSpy() {
  observedRoots = [];
  class SpyMutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe(node) {
      observedRoots.push(node);
    }
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('MutationObserver', SpyMutationObserver);
}

function mountTarget() {
  const container = document.createElement('div');
  container.id = 'coach-target-container';
  const target = document.createElement('button');
  target.setAttribute('data-coach', 'mem16');
  container.appendChild(target);
  document.body.appendChild(container);
  return { container, target };
}

const marks = [{ target: '[data-coach="mem16"]', title: 'Tip', body: 'Body' }];

beforeEach(() => {
  resetCoachMarks();
  installMutationObserverSpy();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  resetCoachMarks();
});

describe('CoachMark live-rect MutationObserver (MEM-16)', () => {
  it('observes the target container, not document.body', () => {
    const { container } = mountTarget();

    render(<CoachMarks surface={SURFACE} marks={marks} />);

    expect(observedRoots.length).toBeGreaterThan(0);
    // Every observed root is the target's parent container...
    expect(observedRoots).toContain(container);
    // ...and never the whole document body.
    expect(observedRoots).not.toContain(document.body);
  });
});
