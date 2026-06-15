// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  editClassSchema,
  announcementSchema,
  userChangePasswordSchema,
  expenseSchema,
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
