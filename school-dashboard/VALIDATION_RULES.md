# Validation Rules and Guidelines

This document outlines the standard and advanced validation rules implemented across the Front Desk and Admission forms to ensure data integrity, prevent spam, and improve user experience.

## 1. Basic Field Validations

These validations ensure that data meets the fundamental format requirements.

| Field | Rule | Error Message |
| :--- | :--- | :--- |
| **Student / Parent Name** | • Required<br>• Letters and spaces only (No numbers or special characters) | "Student/Parent name is required"<br>"Name should contain only letters" |
| **Phone Number** | • Required<br>• Exactly 10 digits | "Please enter a valid 10-digit phone number" |
| **Email Address** | • Optional/Required (context dependent)<br>• Standard email format (user@domain.com) | "Invalid email address" |
| **Class** | • Required Selection | "Please enter/select a class" |
| **Transactions/Amounts** | • Numeric only<br>• Non-negative | "Please enter a valid amount" |

## 2. Advanced Validations

These rules enforce logical constraints and fraud prevention patterns.

### A. Anti-Spam / Quality Checks (Phone Numbers)
We prevent obvious dummy data in phone number fields.
-   **Rule**: Reject numbers consisting of a single repeated digit (e.g., `1111111111`, `9999999999`).
-   **Regex Pattern**: `/^(\d)\1{9}$/` (matches 10 identical digits).
-   **Logic**: If phone matches pattern → **Invalid**.

### B. Logic-Based Date Constraints
Dates are restricted based on their context to prevent logical errors.

| Date Type | Constraint | Implementation Detail |
| :--- | :--- | :--- |
| **Date of Birth** | • Must be in the past<br>• Cannot be in the future | `max={new Date().toISOString().split('T')[0]}` (Today) |
| **Payment Date** | • Must be today or earlier<br>• Future payments are not allowed for history | `max={new Date().toISOString().split('T')[0]}` |
| **Test/Assessment Date** | • Must be in the future (for scheduling) | Custom function: `validateFutureDate(date)` |
| **Standard Date Fields** | • Year cannot exceed 4 digits | `max="9999-12-31"` |

### C. Input Masking (Real-time Sanitization)
To improve UX, some fields sanitize input as the user types.
-   **Phone Number**: Automatically strips non-numeric characters. User cannot type letters into the phone field.
-   **Class Selection**: Dropdown list populated dynamically from the backend to ensure consistent data entry.

## 3. Implementation Patterns

### Regex Definitions
```javascript
// Name Validation (Letters & Spaces only)
const nameRegex = /^[a-zA-Z\s]*$/;

// Email Validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone Validation (10 digits)
const phoneRegex = /^\d{10}$/;

// Repetitive Number Check (e.g. 11111... or 00000...)
const repetitiveNumberRegex = /^(\d)\1{9}$/;
```

### Usage Example (React)

```javascript
const validateField = (name, value) => {
  let error = '';

  switch (name) {
    case 'studentName':
      if (!value.trim()) error = 'Name is required';
      else if (!nameRegex.test(value)) error = 'Only letters allowed';
      break;
      
    case 'phoneNumber':
      if (!value) error = 'Phone is required';
      else if (!phoneRegex.test(value)) error = 'Must be 10 digits';
      else if (repetitiveNumberRegex.test(value)) error = 'Invalid phone number';
      break;
      
    case 'dateOfBirth':
        const today = new Date().toISOString().split('T')[0];
        if (value > today) error = 'Date cannot be in the future';
        break;
  }
  
  return error;
};
```

## 4. Specific Form Rules: Admission Inquiry

-   **Student Name**: `[Required]`, `[Letters Only]`.
-   **Parent Name**: `[Required]`, `[Letters Only]`.
-   **Phone**: `[Required]`, `[10 Digits]`, `[Not Repetitive]`.
-   **Class**: `[Required]`, `[Dropdown Selection]`.
-   **HSC Group**: Only appears if Class 11/12 is selected.
-   **Assessment**:
    -   If "Assessment Required" is checked: `Assigned Teacher` and `Test Date` become **Required**.
    -   `Test Date` must be in the **Future**.
-   **Payment**:
    -   `Payment Date` cannot be in the **Future**.
    -   `Transaction ID` required if payment is made.
