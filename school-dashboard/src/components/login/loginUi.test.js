import { describe, it, expect } from 'vitest';
import {
  fieldLabelClass,
  inputShellClass,
  textInputClass,
  primaryButtonClass,
} from './loginUi';

describe('loginUi — exports are defined strings', () => {
  it('fieldLabelClass is a non-empty string', () => {
    expect(typeof fieldLabelClass).toBe('string');
    expect(fieldLabelClass.trim().length).toBeGreaterThan(0);
  });

  it('inputShellClass is a non-empty string', () => {
    expect(typeof inputShellClass).toBe('string');
    expect(inputShellClass.trim().length).toBeGreaterThan(0);
  });

  it('textInputClass is a non-empty string', () => {
    expect(typeof textInputClass).toBe('string');
    expect(textInputClass.trim().length).toBeGreaterThan(0);
  });

  it('primaryButtonClass is a non-empty string', () => {
    expect(typeof primaryButtonClass).toBe('string');
    expect(primaryButtonClass.trim().length).toBeGreaterThan(0);
  });
});

describe('loginUi — fieldLabelClass content', () => {
  it('fieldLabelClass contains "text-xs"', () => {
    expect(fieldLabelClass).toContain('text-xs');
  });

  it('fieldLabelClass contains "font-medium"', () => {
    expect(fieldLabelClass).toContain('font-medium');
  });
});

describe('loginUi — inputShellClass content', () => {
  it('inputShellClass contains "border"', () => {
    expect(inputShellClass).toContain('border');
  });

  it('inputShellClass contains "rounded"', () => {
    expect(inputShellClass).toContain('rounded');
  });

  it('inputShellClass contains "flex"', () => {
    expect(inputShellClass).toContain('flex');
  });

  it('inputShellClass contains "items-center"', () => {
    expect(inputShellClass).toContain('items-center');
  });
});

describe('loginUi — primaryButtonClass content', () => {
  it('primaryButtonClass contains "bg-primary"', () => {
    expect(primaryButtonClass).toContain('bg-primary');
  });

  it('primaryButtonClass contains "text-white"', () => {
    expect(primaryButtonClass).toContain('text-white');
  });

  it('primaryButtonClass contains "rounded"', () => {
    expect(primaryButtonClass).toContain('rounded');
  });
});

describe('loginUi — textInputClass content', () => {
  it('textInputClass contains "bg-transparent"', () => {
    expect(textInputClass).toContain('bg-transparent');
  });

  it('textInputClass contains "outline-none"', () => {
    expect(textInputClass).toContain('outline-none');
  });
});
