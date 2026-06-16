// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  editClassSchema,
  announcementSchema,
  userChangePasswordSchema,
  expenseSchema,
  addStaffStep1Schema,
  addStaffStep2Schema,
  addStaffStep3Schema,
  addStaffStep4Schema,
  addStaffSchema,
  parseFormSchema,
} from './formSchemas';

describe('editClassSchema', () => {
  it('accepts a valid class with positive integer capacity', () => {
    const result = editClassSchema.safeParse({
      section: 'A',
      strengthLimit: '40',
      room: '101',
      block: 'B',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty capacity', () => {
    const result = editClassSchema.safeParse({
      section: 'A',
      strengthLimit: '',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/Capacity is required/);
  });

  it('rejects zero, negative, and non-integer capacity', () => {
    for (const val of ['0', '-1', '3.5', 'abc']) {
      const result = editClassSchema.safeParse({
        section: 'A',
        strengthLimit: val,
      });
      expect(result.success).toBe(false);
    }
  });

  it('rejects capacity above the 10000 ceiling', () => {
    const result = editClassSchema.safeParse({
      section: 'A',
      strengthLimit: '10001',
    });
    expect(result.success).toBe(false);
  });
});

describe('announcementSchema', () => {
  const valid = {
    title: 'Holiday tomorrow',
    content: 'School closed on Friday.',
    recipients: [{ type: 'all' }],
    channels: ['inapp'],
    scheduledFor: null,
    attachments: [],
  };

  it('accepts a valid announcement', () => {
    expect(announcementSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty title, content, recipients, channels', () => {
    const result = announcementSchema.safeParse({
      title: '',
      content: '',
      recipients: [],
      channels: [],
      scheduledFor: null,
      attachments: [],
    });
    expect(result.success).toBe(false);
    const messages = result.error.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Title is required/),
        expect.stringMatching(/Content is required/),
        expect.stringMatching(/audience/),
        expect.stringMatching(/channel/),
      ]),
    );
  });

  it('rejects past scheduledFor dates', () => {
    const result = announcementSchema.safeParse({
      ...valid,
      scheduledFor: '2020-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/future/);
  });

  it('accepts future scheduledFor dates', () => {
    const result = announcementSchema.safeParse({
      ...valid,
      scheduledFor: '2099-12-31T23:59:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid audience / channel enums', () => {
    const result = announcementSchema.safeParse({
      ...valid,
      recipients: [{ type: 'unknown' }],
      channels: ['fax'],
    });
    expect(result.success).toBe(false);
  });
});

describe('userChangePasswordSchema', () => {
  it('accepts a strong password that matches confirmation', () => {
    const result = userChangePasswordSchema.safeParse({
      newPassword: 'StrongP4ss',
      confirmPassword: 'StrongP4ss',
    });
    expect(result.success).toBe(true);
  });

  it('rejects the legacy 5-character policy (CODE-05 audit fix)', () => {
    const result = userChangePasswordSchema.safeParse({
      newPassword: 'Ab1cd',
      confirmPassword: 'Ab1cd',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/at least 8/);
  });

  it('rejects passwords missing an uppercase letter', () => {
    const result = userChangePasswordSchema.safeParse({
      newPassword: 'weakpass1',
      confirmPassword: 'weakpass1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects passwords missing a digit', () => {
    const result = userChangePasswordSchema.safeParse({
      newPassword: 'NoDigitsHere',
      confirmPassword: 'NoDigitsHere',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched confirmation', () => {
    const result = userChangePasswordSchema.safeParse({
      newPassword: 'StrongP4ss',
      confirmPassword: 'OtherP4ss',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['confirmPassword']);
  });
});

describe('expenseSchema (regression — already Zod-validated pre-CODE-05)', () => {
  it('rejects a negative amount', () => {
    const result = expenseSchema.safeParse({
      title: 'X',
      amount: -5,
      category: 'other',
      paymentMode: 'cash',
      expenseDate: '2026-06-15',
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });
});

const validForm = {
  firstName: "Anika",
  lastName: "Rao",
  code: "EMP016",
  displayName: "Anika R.",
  role: "Teaching",
  subject: "Mathematics",
  dept: "Teaching",
  classes: ["10-A", "10-B"],
  email: "anika.rao@school.edu",
  phone: "9876512345",
  emergencyContact: "Parent 9876543210",
  address: "42, Park Street",
  joinDate: "2026-06-01",
  employmentType: "Full-time",
  salary: "58000",
};

describe("addStaffStep1Schema (identity)", () => {
  it("accepts a complete identity section", () => {
    const result = parseFormSchema(addStaffStep1Schema, {
      firstName: "Anika",
      lastName: "Rao",
    });
    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("flags empty firstName and lastName", () => {
    const result = parseFormSchema(addStaffStep1Schema, {
      firstName: "",
      lastName: "   ",
    });
    expect(result.success).toBe(false);
    expect(result.errors.firstName).toMatch(/required/i);
    expect(result.errors.lastName).toMatch(/required/i);
  });
});

describe("addStaffStep2Schema (role & teaching)", () => {
  it("requires subject when role is Teaching", () => {
    const result = parseFormSchema(addStaffStep2Schema, {
      role: "Teaching",
      subject: "",
      dept: "Teaching",
    });
    expect(result.success).toBe(false);
    expect(result.errors.subject).toMatch(/teaching/i);
  });

  it("passes when role is non-Teaching and subject is empty", () => {
    const result = parseFormSchema(addStaffStep2Schema, {
      role: "Admin",
      subject: "",
      dept: "Admin",
    });
    expect(result.success).toBe(true);
  });

  it("requires department", () => {
    const result = parseFormSchema(addStaffStep2Schema, {
      role: "Teaching",
      subject: "Math",
      dept: "",
    });
    expect(result.success).toBe(false);
    expect(result.errors.dept).toMatch(/required/i);
  });
});

describe("addStaffStep3Schema (contact)", () => {
  it("rejects malformed email", () => {
    const result = parseFormSchema(addStaffStep3Schema, {
      email: "not-an-email",
      phone: "9876512345",
    });
    expect(result.success).toBe(false);
    expect(result.errors.email).toMatch(/valid email/i);
  });

  it("rejects empty email", () => {
    const result = parseFormSchema(addStaffStep3Schema, {
      email: "",
      phone: "9876512345",
    });
    expect(result.success).toBe(false);
    expect(result.errors.email).toMatch(/required/i);
  });

  it("rejects phone numbers that are not 10-digit-IN", () => {
    const result = parseFormSchema(addStaffStep3Schema, {
      email: "anika.rao@school.edu",
      phone: "12345",
    });
    expect(result.success).toBe(false);
    expect(result.errors.phone).toMatch(/10-digit/i);
  });

  it("rejects phone numbers starting with an invalid prefix", () => {
    const result = parseFormSchema(addStaffStep3Schema, {
      email: "anika.rao@school.edu",
      phone: "1234567890",
    });
    expect(result.success).toBe(false);
    expect(result.errors.phone).toMatch(/10-digit/i);
  });

  it("accepts a valid 10-digit-IN phone", () => {
    const result = parseFormSchema(addStaffStep3Schema, {
      email: "anika.rao@school.edu",
      phone: "9876512345",
    });
    expect(result.success).toBe(true);
  });
});

describe("addStaffStep4Schema (employment)", () => {
  it("requires joinDate and employmentType", () => {
    const result = parseFormSchema(addStaffStep4Schema, {
      joinDate: "",
      employmentType: "",
    });
    expect(result.success).toBe(false);
    expect(result.errors.joinDate).toMatch(/required/i);
    expect(result.errors.employmentType).toMatch(/required/i);
  });

  it("passes when only the required employment fields are filled", () => {
    const result = parseFormSchema(addStaffStep4Schema, {
      joinDate: "2026-06-01",
      employmentType: "Full-time",
    });
    expect(result.success).toBe(true);
  });
});

describe("addStaffSchema (composite)", () => {
  it("accepts a fully-valid staff form", () => {
    const result = parseFormSchema(addStaffSchema, validForm);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("reports every missing field at once", () => {
    const result = parseFormSchema(addStaffSchema, {
      firstName: "",
      lastName: "",
      role: "Teaching",
      subject: "",
      dept: "",
      email: "",
      phone: "",
      joinDate: "",
      employmentType: "",
    });
    expect(result.success).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
    expect(result.errors.subject).toBeDefined();
    expect(result.errors.dept).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.phone).toBeDefined();
    expect(result.errors.joinDate).toBeDefined();
    expect(result.errors.employmentType).toBeDefined();
  });

  it("rejects a non-Teaching staff with a subject as a warning only (per schema)", () => {
    const result = parseFormSchema(addStaffSchema, {
      ...validForm,
      role: "Admin",
      subject: "",
    });
    expect(result.success).toBe(true);
  });
});
