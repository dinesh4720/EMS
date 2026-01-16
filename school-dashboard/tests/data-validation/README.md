# Data Integrity & Field Mapping Tests

## Overview

These tests go beyond UX validation to verify **data integrity** throughout your application:

### What These Tests Check

For every input field in your forms:

1. **✓ Input → Database**: Does the data actually save to the database?
2. **✓ Database → UI**: Is the saved data displayed/used anywhere?
3. **⚠ Unused Fields**: Are there fields that don't connect to anything?

### Test Files

| Test File | Purpose |
|-----------|---------|
| `data-validation.spec.ts` | Staff creation field mapping |
| `student-data-validation.spec.ts` | Student admission field mapping |
| `fee-data-validation.spec.ts` | Fee payment field mapping |
| `field-mapping-scanner.spec.ts` | Complete application field scan |

---

## Running Data Validation Tests

### Run All Data Validation Tests
```bash
npx playwright test tests/data-validation/
```

### Run Specific Test
```bash
# Staff validation
npx playwright test tests/data-validation/data-validation.spec.ts

# Student validation
npx playwright test tests/data-validation/student-data-validation.spec.ts

# Fee validation
npx playwright test tests/data-validation/fee-data-validation.spec.ts

# Full field scanner
npx playwright test tests/data-validation/field-mapping-scanner.spec.ts
```

### Run with Report Generation
```bash
npx playwright test tests/data-validation/ --reporter=json
```

---

## Understanding the Reports

### Report Structure

Each test generates a JSON report with:

```json
{
  "testName": "DATA-002: Student Admission Validation",
  "timestamp": "2024-01-15T10:30:00Z",
  "totalFields": 15,
  "fieldsStoredInDb": 14,
  "fieldsMatched": 13,
  "fieldsNotStored": 1,
  "fieldsNotMatched": 1,
  "unusedFields": 2,
  "fieldDetails": [
    {
      "inputName": "First Name",
      "fieldName": "firstName",
      "inputValue": "John",
      "dbValue": "John",
      "stored": true,
      "matched": true,
      "utilization": ["student-list", "student-profile", "fee-records"]
    },
    {
      "inputName": "Middle Name",
      "fieldName": "middleName",
      "inputValue": "Test",
      "dbValue": "NOT_FOUND",
      "stored": false,
      "matched": false,
      "utilization": []
    }
  ],
  "recommendations": [
    "1 field is NOT being saved to database. Review form submission logic.",
    "2 fields are stored but never used. Consider removing them."
  ]
}
```

### Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| ✓ Stored & Matched | Data saves correctly and matches | No action needed |
| ✓ Stored, Not Matched | Data saves but with different value | Check data transformation logic |
| ✗ Not Stored | Field doesn't save to DB | Check backend route/controller |
| ⚠ Stored but Unused | Data saves but never displayed | Implement usage or remove field |

---

## Example Test Output

```
=== DATA VALIDATION REPORT ===

Field: firstName
  Input: "John"
  DB: "John"
  Stored: ✓
  Matched: ✓
  Utilization: student-list, student-profile, fee-records

Field: middleName
  Input: "Test"
  DB: "NOT_FOUND"
  Stored: ✗
  Matched: ✗
  Utilization: NONE (FIELD NOT CONNECTED TO DB)

Field: bloodGroup
  Input: "O+"
  DB: "O Positive"
  Stored: ✓
  Matched: ✗
  Utilization: student-profile

⚠️ WARNING: 1 fields are stored but not used anywhere:
  - middleName

SUMMARY:
Total Fields: 15
Stored in DB: 14 (93.3%)
Matched: 13 (92.9% of stored)
Unused: 1 (7.1% of stored)

RECOMMENDATIONS:
1. Field 'middleName' is not saving to database. Check if backend expects 'middleName' or 'middle_name'
2. Consider removing unused field 'middleName' or implement its usage in UI
```

---

## How It Works

### Step 1: Form Field Detection
- Opens each form in the application
- Identifies all input fields (text, select, textarea, etc.)
- Records field names, types, and requirements

### Step 2: Data Submission
- Fills each field with test data
- Submits the form
- Waits for confirmation

### Step 3: Database Verification
- Queries the database via API
- Searches for the submitted record
- Compares input values with stored values
- Reports any mismatches

### Step 4: Utilization Check
- Searches the UI for the stored data
- Checks if data appears in:
  - List views/tables
  - Detail/profile pages
  - Filters/search
  - Reports
  - Related records (fees, attendance, etc.)

### Step 5: Report Generation
- Creates comprehensive JSON report
- Lists all fields with their status
- Provides recommendations for improvement
- Saves to `test-results/` directory

---

## Configuration

### API Endpoint Configuration

The tests use standard REST API patterns:
- `GET /api/staff?email={email}` - Search by email
- `GET /api/students/{id}` - Get student by ID
- `GET /api/fees/payments?limit=1` - Get recent payment

If your API uses different patterns, update the test files accordingly.

### Field Name Mapping

Field names are automatically mapped using these patterns:

```javascript
// Frontend → Database field mappings
{
  'firstname' → 'firstName',
  'lastname' → 'lastName',
  'dob' → 'dateOfBirth',
  'phone' → 'phone',
  'email' → 'email',
  // ... etc
}
```

Add custom mappings in the test files if needed.

---

## Prerequisites

1. **Backend must be running** on port 5000
2. **Test user must exist** with admin privileges
3. **API endpoints must be accessible** for data verification
4. **Database must be accessible** (indirectly via API)

---

## Interpreting Results

### Good Health Indicators
- ✓ 90%+ fields stored in database
- ✓ 95%+ stored fields matched (exact value)
- ✓ 80%+ stored fields utilized in UI
- ✓ No orphan fields (unconnected fields)

### Warning Signs
- ⚠ Less than 80% field storage rate
- ⚠ High mismatch rate between input and DB
- ⚠ Many stored but unused fields
- ⚠ Orphan fields detected

### Critical Issues
- ✗ Required fields not saving
- ✗ Critical data (name, email) not stored
- ✗ Less than 50% field connection rate

---

## Fixing Issues

### Issue: Field Not Saving to Database

**Possible Causes:**
1. Backend doesn't expect this field name
2. Field name mismatch (camelCase vs snake_case)
3. Missing in request body
4. Validation error on backend

**Solutions:**
1. Check backend controller/schema
2. Verify field name matches expected format
3. Check console for validation errors
4. Test API endpoint directly with Postman/Thunder Client

### Issue: Data Saves but Value Mismatch

**Possible Causes:**
1. Data transformation (e.g., "O+" → "O Positive")
2. Trimming or formatting
3. Case conversion
4. Default values applied

**Solutions:**
1. Check if transformation is intentional
2. Update test expectations if transformation is correct
3. Fix backend if transformation is wrong

### Issue: Field Stored But Never Used

**Possible Causes:**
1. Feature not fully implemented
2. Forgotten field
3. Future-proofing field
4. Legacy field

**Solutions:**
1. Implement usage in UI
2. Remove field if not needed
3. Document why field exists

---

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Data Integrity Tests
  run: |
    cd school-dashboard
    npx playwright test tests/data-validation/

- name: Upload Field Mapping Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: field-mapping-report
    path: school-dashboard/test-results/field-mapping-report.json
```

Set thresholds to fail build if data integrity is poor:

```javascript
// In test file
expect(validationRate).toBeGreaterThan(0.8); // 80% minimum
```

---

## Best Practices

1. **Run regularly** - At least weekly during active development
2. **Run before deployments** - Ensure no regressions
3. **Review reports** - Don't just check pass/fail
4. **Fix unused fields** - Keep codebase clean
5. **Document intentional unused fields** - Add comments explaining why
6. **Update field mappings** - Keep them in sync with backend

---

## Troubleshooting

### Tests Fail with "API Not Found"

**Solution:**
- Ensure backend is running
- Check API endpoint URLs in tests
- Verify CORS configuration

### Tests Pass But Fields Show as "Not Stored"

**Solution:**
- Check if form actually submits
- Look for console errors during submission
- Verify backend receives the data
- Check backend logs for errors

### False Positives for "Unused Fields"

**Solution:**
- Update utilization checks in tests
- Add custom usage locations
- Some fields might be used in ways tests can't detect
- Manually verify if field is actually used

---

## Extending Tests

### Add New Form to Scanner

Edit `field-mapping-scanner.spec.ts`:

```javascript
const pagesToScan = [
  { path: '/your-new-page', name: 'Your New Page', addButton: /add|create/i },
  // ... existing pages
];
```

### Add Custom Utilization Checks

In test file, add:

```javascript
// Check custom usage
const customResponse = await request.get(`/api/custom-endpoint?field=${value}`);
if (customResponse.ok()) {
  utilization.push('custom-feature');
}
```

### Add Field Name Mappings

In mapping function:

```javascript
function mapFieldNameToDbField(fieldName: string): string {
  const fieldMap = {
    // Add your mappings
    'myField': 'my_field_in_db',
  };
  // ...
}
```

---

## Summary

These tests ensure your application's **data integrity** by verifying:
- Every input field connects to the database
- Data is stored correctly
- Stored data is actually used
- No orphan/unused fields exist

Run them regularly to maintain data quality throughout your application!
