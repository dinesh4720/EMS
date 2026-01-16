# Salary Setup Guide

## How to Set Up Salaries for All Employees

I have added a new "Fix Salaries" button to the Payroll page to help you quickly set up salaries for all employees.

### Steps:
1.  **Restart the Backend Server:** This is crucial for the new changes to take effect.
2.  **Restart the Frontend Server:** (Optional but recommended) Refresh your browser.
3.  **Navigate to Payroll:** Go to the Payroll section in the dashboard.
4.  **Click "Fix Salaries":** You will see a new orange button labeled "Fix Salaries" next to the "Run Payroll" button.
5.  **Confirm:** Click "OK" on the confirmation dialog.

### What it does:
*   It scans all staff members.
*   If a staff member has **no salary** or **salary is 0**, it sets it to **50,000**.
*   If a staff member has no employment type, it sets it to **'full_time'**.
*   It reports back how many records were updated.

### After Running Fix:
Once the fix is applied, you can click **"Run Payroll"** again, and it should work for all active staff members!
