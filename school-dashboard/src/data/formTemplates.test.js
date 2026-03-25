import { describe, it, expect } from 'vitest';
import {
  staffOnboardingTemplate,
  studentAdmissionTemplate,
  formTemplates,
} from './formTemplates';

const VALID_FIELD_TYPES = ['text', 'email', 'phone', 'date', 'dropdown', 'file', 'textarea', 'number'];

const namedTemplates = [
  { name: 'staffOnboardingTemplate', template: staffOnboardingTemplate },
  { name: 'studentAdmissionTemplate', template: studentAdmissionTemplate },
];

// ─── formName string ──────────────────────────────────────────────────────────

describe('formTemplates - formName', () => {
  it('staffOnboardingTemplate has a non-empty formName string', () => {
    expect(typeof staffOnboardingTemplate.formName).toBe('string');
    expect(staffOnboardingTemplate.formName.trim().length).toBeGreaterThan(0);
  });

  it('studentAdmissionTemplate has a non-empty formName string', () => {
    expect(typeof studentAdmissionTemplate.formName).toBe('string');
    expect(studentAdmissionTemplate.formName.trim().length).toBeGreaterThan(0);
  });

  it('formTemplates array entries with template objects have their own name property', () => {
    const namedEntries = formTemplates.filter(t => t.template.formName);
    expect(namedEntries.length).toBeGreaterThan(0);
  });
});

// ─── fields array non-empty ───────────────────────────────────────────────────

describe('formTemplates - fields array', () => {
  it('staffOnboardingTemplate has a non-empty fields array', () => {
    expect(Array.isArray(staffOnboardingTemplate.fields)).toBe(true);
    expect(staffOnboardingTemplate.fields.length).toBeGreaterThan(0);
  });

  it('studentAdmissionTemplate has a non-empty fields array', () => {
    expect(Array.isArray(studentAdmissionTemplate.fields)).toBe(true);
    expect(studentAdmissionTemplate.fields.length).toBeGreaterThan(0);
  });
});

// ─── field shape: id, label, type, required ───────────────────────────────────

describe('formTemplates - field shape', () => {
  namedTemplates.forEach(({ name, template }) => {
    it(`every field in ${name} has id, label, type, and required`, () => {
      template.fields.forEach((field, idx) => {
        expect(field, `field at index ${idx} missing id`).toHaveProperty('id');
        expect(field, `field at index ${idx} missing label`).toHaveProperty('label');
        expect(field, `field at index ${idx} missing type`).toHaveProperty('type');
        expect(field, `field at index ${idx} missing required`).toHaveProperty('required');
      });
    });
  });
});

// ─── required is boolean ──────────────────────────────────────────────────────

describe('formTemplates - required is a boolean', () => {
  namedTemplates.forEach(({ name, template }) => {
    it(`every field in ${name} has required as a boolean (not a string)`, () => {
      template.fields.forEach((field) => {
        expect(typeof field.required, `field "${field.label}" has non-boolean required`).toBe('boolean');
      });
    });
  });
});

// ─── valid field types ────────────────────────────────────────────────────────

describe('formTemplates - valid field types', () => {
  namedTemplates.forEach(({ name, template }) => {
    it(`every field type in ${name} is a valid type string`, () => {
      template.fields.forEach((field) => {
        expect(
          VALID_FIELD_TYPES,
          `field "${field.label}" has unexpected type "${field.type}"`
        ).toContain(field.type);
      });
    });
  });
});

// ─── no duplicate ids within a template ───────────────────────────────────────

describe('formTemplates - no duplicate field ids', () => {
  namedTemplates.forEach(({ name, template }) => {
    it(`${name} has no duplicate field ids`, () => {
      const ids = template.fields.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

// ─── at least one required field ─────────────────────────────────────────────

describe('formTemplates - at least one required field', () => {
  namedTemplates.forEach(({ name, template }) => {
    it(`${name} has at least one field marked required: true`, () => {
      const hasRequired = template.fields.some(f => f.required === true);
      expect(hasRequired).toBe(true);
    });
  });
});

// ─── formTemplates registry array ────────────────────────────────────────────

describe('formTemplates registry', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(formTemplates)).toBe(true);
    expect(formTemplates.length).toBeGreaterThan(0);
  });

  it('each entry has id, name, description, and template', () => {
    formTemplates.forEach((entry, idx) => {
      expect(entry, `entry ${idx}`).toHaveProperty('id');
      expect(entry, `entry ${idx}`).toHaveProperty('name');
      expect(entry, `entry ${idx}`).toHaveProperty('description');
      expect(entry, `entry ${idx}`).toHaveProperty('template');
    });
  });

  it('blank template entry has empty fields array', () => {
    const blank = formTemplates.find(t => t.id === 'blank');
    expect(blank).toBeDefined();
    expect(blank.template.fields).toEqual([]);
  });

  it('staff-onboarding entry template matches staffOnboardingTemplate', () => {
    const entry = formTemplates.find(t => t.id === 'staff-onboarding');
    expect(entry).toBeDefined();
    expect(entry.template).toBe(staffOnboardingTemplate);
  });

  it('student-admission entry template matches studentAdmissionTemplate', () => {
    const entry = formTemplates.find(t => t.id === 'student-admission');
    expect(entry).toBeDefined();
    expect(entry.template).toBe(studentAdmissionTemplate);
  });
});
