# Public Form Submission Feature

## Overview
This feature allows parents to submit intake forms via secure token links without requiring authentication.

## How It Works

### 1. Form Assignment
When a school admin assigns a form to a parent:
- A unique token is generated for each assignment
- The parent receives a link like: `https://yourschool.com/form/abc123xyz`

### 2. Public Access
- The `/form/:token` route is publicly accessible (no login required)
- Parents can access the form directly from the link
- Works on any device (desktop, tablet, mobile)

### 3. Token Validation
When the page loads:
1. Token is validated against the backend API
2. Form details are fetched if token is valid
3. Checks if form has already been submitted
4. Handles expired/invalid tokens gracefully

### 4. Form Submission
- Parents fill out the form fields dynamically
- Client-side validation ensures required fields are completed
- Submission is sent to `/api/public/form-submission/:token`
- Success message is displayed upon completion

## API Endpoints

### GET `/api/public/form-assignment/:token`
Fetches form details for a valid token.

**Response:**
```json
{
  "id": "form-123",
  "formTitle": "Student Intake Form 2024",
  "formDescription": "Please complete this form for your child",
  "formStructure": [
    {
      "id": "studentName",
      "type": "text",
      "label": "Student Name",
      "required": true
    }
  ],
  "deadline": "2024-12-31T23:59:59Z",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### POST `/api/public/form-submission/:token`
Submits the form responses.

**Request Body:**
```json
{
  "responses": {
    "studentName": "John Doe",
    "parentEmail": "parent@example.com"
  },
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

### GET `/api/public/form-submission/:token/status`
Checks if form has already been submitted.

**Response:**
```json
{
  "submitted": true,
  "submittedAt": "2024-01-15T10:30:00Z",
  "submitterName": "Jane Doe"
}
```

## UI States

### 1. Loading State
- Shows animated spinner with "Loading form..." message
- Displayed while validating token

### 2. Error State
- Shown when token is invalid, expired, or form was canceled
- Displays friendly error message with "Return to Home" button
- Icon: Red X circle

### 3. Already Submitted State
- Shown when parent tries to access a form they've already submitted
- Shows submission date and time
- Icon: Green checkmark

### 4. Success State
- Displayed after successful form submission
- Shows confirmation with timestamp
- Animated "Thank You!" message
- Icon: Bouncing green checkmark

### 5. Main Form State
- Displays form fields dynamically based on form structure
- Clean, professional interface with gradient background
- Responsive design for all screen sizes

## Supported Field Types

| Type | Component | Validation |
|------|-----------|------------|
| `text` | Input | Required check |
| `email` | Input | Required + email format |
| `phone` | Input | Required + phone format |
| `textarea` | Textarea | Required check |
| `number` | Input | Required check |
| `date` | Input | Required check |
| `select` | Select dropdown | Required check |
| `checkbox` | Checkbox | Required check |

## Design Features

### Visual Design
- **Gradient Background**: Soft gradient from default-50 to default-100
- **Ambient Effects**: Animated blob decorations for depth
- **Card-based Layout**: Clean shadow-lg cards with borders
- **Color Scheme**: Primary/secondary gradient accents
- **Typography**: Clear hierarchy with Inter font

### User Experience
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Proper labels, error messages, and ARIA attributes
- **Loading Feedback**: Spinner animations during async operations
- **Error Handling**: Clear error messages with actionable next steps
- **Success Feedback**: Celebratory success state with confetti-ready design

### HeroUI Components Used
- Card, CardBody
- Button (with loading state)
- Input, Textarea
- Chip (for status indicators)
- Divider
- Spinner

## Security Considerations

### Token Security
- Tokens are unique per assignment
- Tokens have expiration dates
- Tokens can be revoked by admin

### Validation
- Server-side token validation
- Server-side form submission validation
- Client-side validation for better UX

### Rate Limiting
- Implement rate limiting on submission endpoint
- Prevent spam submissions

## Future Enhancements

1. **File Upload Support**: Allow parents to upload documents
2. **Save as Draft**: Allow partial form completion
3. **Multi-step Forms**: Break long forms into steps
4. **Progress Indicator**: Show completion progress
5. **Email Confirmation**: Send confirmation email after submission
6. **Edit Submission**: Allow editing within a time window

## Testing Checklist

- [ ] Valid token loads form correctly
- [ ] Invalid/expired token shows error state
- [ ] Already submitted form shows submission status
- [ ] Required field validation works
- [ ] Email validation works correctly
- [ ] Phone validation works correctly
- [ ] Form submission succeeds with valid data
- [ ] Form submission fails with invalid data
- [ ] Success state displays after submission
- [ ] Responsive design works on mobile
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful

## File Structure

```
school-dashboard/src/
├── pages/
│   └── PublicFormSubmission.jsx    # Main public form component
├── services/
│   └── api.js                       # API service (includes publicApi)
└── App.jsx                          # Routing configuration
```

## Usage Example

1. **Admin creates form assignment**:
```javascript
await intakeFormsApi.assign(formId, {
  recipientEmail: "parent@example.com",
  recipientName: "Jane Doe",
  deadline: "2024-12-31",
  expiresAt: "2024-12-31"
});
```

2. **Parent receives link**:
```
https://yourschool.com/form/a1b2c3d4e5f6
```

3. **Parent submits form**:
```javascript
await publicApi.submitForm(token, {
  responses: formValues,
  submittedAt: new Date().toISOString()
});
```

## Troubleshooting

### Form not loading
- Check if token is valid in database
- Verify backend API is running
- Check browser console for errors

### Submission failing
- Verify all required fields are filled
- Check API endpoint is correct
- Review server logs for errors

### Token expired
- Contact admin to regenerate token
- Check if form deadline has passed
