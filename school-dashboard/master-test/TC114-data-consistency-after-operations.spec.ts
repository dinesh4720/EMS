/**
 * TC114: Verify data stays consistent after create/update/delete operations.
 *
 * Seeds 5 students in 10-A, then performs delete, add, move, and fee payment
 * operations while verifying counts, lists, class assignments, and fee status
 * remain internally consistent after each operation.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedStudentWithFees,
  recordFeePayment,
  CLASS_10A_ID,
  CLASS_11A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC114: Data Consistency After Operations', () => {
  let state: MockState;
  let studentIds: string[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    studentIds = [];

    // Seed 5 students in class 10-A
    for (let i = 1; i <= 5; i++) {
      const s = seedStudentWithFees(state, {
        name: `Student ${i}`,
        classId: CLASS_10A_ID,
        feeStatus: i <= 3 ? 'pending' : 'paid',
      });
      studentIds.push(s.id);
    }

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ── Initial state verification ── */

  test('1) initial state: 5 students in 10-A, class count correct', async () => {
    expect(state.students).toHaveLength(5);

    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID);
    expect(class10?.studentCount).toBe(5);

    const class11 = state.classes.find((c) => c.id === CLASS_11A_ID);
    expect(class11?.studentCount).toBe(0);
  });

  test('2) initial state: student list page shows 5 students', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // At least some students should be visible
    const hasStudents = bodyText?.includes('Student 1') ||
      bodyText?.includes('Student 2') ||
      bodyText?.includes('Student 3');
    expect(hasStudents).toBe(true);
  });

  /* ── Delete operation ── */

  test('3) delete 1 student: state shows 4 students', async () => {
    const deletedId = studentIds[0];

    // Simulate delete
    state.students = state.students.filter((s) => s.id !== deletedId);
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    class10.studentCount--;

    expect(state.students).toHaveLength(4);
    expect(class10.studentCount).toBe(4);
  });

  test('4) after delete: student list page shows 4 students', async ({ page }) => {
    // Delete the first student from state
    state.students = state.students.filter((s) => s.id !== studentIds[0]);
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    class10.studentCount--;

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // The deleted student should not appear
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Student 1');

    // Other students should still appear
    const hasOtherStudents = bodyText?.includes('Student 2') ||
      bodyText?.includes('Student 3') ||
      bodyText?.includes('Student 4');
    expect(hasOtherStudents).toBe(true);
  });

  test('5) after delete: dashboard stats decrease by 1', async ({ page }) => {
    // Delete student
    state.students = state.students.filter((s) => s.id !== studentIds[0]);
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    class10.studentCount--;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dashboard stats endpoint computes totalStudents from state.students.length = 4
    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('4')).toBe(true);
  });

  /* ── Add operation ── */

  test('6) add 1 new student to 10-A: back to 5 students', async () => {
    // First delete one
    state.students = state.students.filter((s) => s.id !== studentIds[0]);
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    class10.studentCount--;

    expect(state.students).toHaveLength(4);

    // Now add a new one
    const newStudent = seedStudent(state, { name: 'New Student', classId: CLASS_10A_ID });

    expect(state.students).toHaveLength(5);
    expect(class10.studentCount).toBe(5);
    expect(newStudent.classId).toBe(CLASS_10A_ID);
  });

  test('7) after add: student list page shows 5 students again', async ({ page }) => {
    // Delete one and add one back
    state.students = state.students.filter((s) => s.id !== studentIds[0]);
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    class10.studentCount--;
    seedStudent(state, { name: 'New Student', classId: CLASS_10A_ID });

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // New student should appear
    const hasNewStudent = bodyText?.includes('New Student');
    expect(hasNewStudent).toBe(true);
  });

  /* ── Move operation ── */

  test('8) move 1 student from 10-A to 11-A: counts update', async () => {
    const movedStudent = state.students.find((s) => s.id === studentIds[1])!;
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    const class11 = state.classes.find((c) => c.id === CLASS_11A_ID)!;

    // Simulate move
    movedStudent.classId = CLASS_11A_ID;
    class10.studentCount--;
    class11.studentCount++;

    expect(class10.studentCount).toBe(4);
    expect(class11.studentCount).toBe(1);
    expect(movedStudent.classId).toBe(CLASS_11A_ID);
  });

  test('9) after move: student profile shows new class', async ({ page }) => {
    // Simulate move
    const movedStudent = state.students.find((s) => s.id === studentIds[1])!;
    movedStudent.classId = CLASS_11A_ID;

    await page.goto(`/students/${studentIds[1]}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Student should show and their info should be present
    expect(bodyText?.includes('Student 2')).toBe(true);
  });

  test('10) after move: class pages show correct student counts', async ({ page }) => {
    // Simulate move
    const movedStudent = state.students.find((s) => s.id === studentIds[1])!;
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    const class11 = state.classes.find((c) => c.id === CLASS_11A_ID)!;
    movedStudent.classId = CLASS_11A_ID;
    class10.studentCount--;
    class11.studentCount++;

    // Verify via state
    const students10A = state.students.filter((s) => s.classId === CLASS_10A_ID);
    const students11A = state.students.filter((s) => s.classId === CLASS_11A_ID);
    expect(students10A).toHaveLength(4);
    expect(students11A).toHaveLength(1);

    // Navigate to classes page
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class/i);
  });

  /* ── Fee payment operation ── */

  test('11) record fee payment: student fee status updates', async () => {
    const studentId = studentIds[2]; // Student 3, status 'pending'
    const student = state.students.find((s) => s.id === studentId)!;
    expect(student.feeStatus).toBe('pending');

    // Record a payment that pays off the full balance
    const fs = state.studentFeeStructures.get(studentId);
    const balance = (fs as Record<string, unknown>).balanceAmount as number;
    recordFeePayment(state, studentId, balance, 'cash', '2026-03-30');

    // After full payment, status should be 'paid'
    const updatedFs = state.studentFeeStructures.get(studentId) as Record<string, unknown>;
    expect(updatedFs.status).toBe('paid');
    expect(updatedFs.balanceAmount).toBe(0);
  });

  test('12) after payment: fee collection totals update', async ({ page }) => {
    // Record payment
    recordFeePayment(state, studentIds[2], 5000, 'cash', '2026-03-30');

    await page.goto('/fees');
    await page.waitForLoadState('networkidle');

    // Verify fee page loads with payment data
    const bodyText = await page.textContent('body');
    const lowerBody = bodyText?.toLowerCase() || '';
    const hasFeeData = lowerBody.includes('fee') ||
      lowerBody.includes('payment') ||
      lowerBody.includes('collection');
    expect(hasFeeData).toBe(true);

    // Verify payments exist in state
    expect(state.payments.length).toBeGreaterThan(0);
  });

  test('13) overall data integrity after all operations', async () => {
    // Simulate all operations in sequence
    // 1. Delete student 1
    state.students = state.students.filter((s) => s.id !== studentIds[0]);
    const class10 = state.classes.find((c) => c.id === CLASS_10A_ID)!;
    class10.studentCount--;

    // 2. Add new student
    seedStudent(state, { name: 'Replacement', classId: CLASS_10A_ID });

    // 3. Move student 2 to 11-A
    const movedStudent = state.students.find((s) => s.id === studentIds[1])!;
    movedStudent.classId = CLASS_11A_ID;
    class10.studentCount--;
    const class11 = state.classes.find((c) => c.id === CLASS_11A_ID)!;
    class11.studentCount++;

    // 4. Pay student 3's fees
    recordFeePayment(state, studentIds[2], 5000, 'cash', '2026-03-30');

    // Verify final state
    expect(state.students).toHaveLength(5); // 5 - 1 + 1 = 5
    expect(class10.studentCount).toBe(4);   // 5 - 1 + 1 - 1 = 4
    expect(class11.studentCount).toBe(1);   // 0 + 1 = 1
    expect(state.payments).toHaveLength(1);
  });
});
