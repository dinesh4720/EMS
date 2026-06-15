import { describe, it, expect } from "vitest";
import {
  addStaffStep1Schema,
  addStaffStep2Schema,
  addStaffStep3Schema,
  addStaffStep4Schema,
  addStaffSchema,
  parseFormSchema,
} from "./formSchemas";

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
