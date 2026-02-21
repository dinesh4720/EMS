# Public Form UI States - Visual Guide

## State 1: Loading
**When:** Page first loads, validating token

**Visual Elements:**
- Gradient background (default-50 → background → default-100)
- Dual-ring spinner animation (primary and secondary colors)
- "Loading form..." text below spinner
- Centered vertically and horizontally

**Code Reference:**
```jsx
{loading && (
  <div className="min-h-screen flex items-center justify-center bg-gradient...">
    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p>Loading form...</p>
  </div>
)}
```

---

## State 2: Error
**When:** Token is invalid, expired, or form canceled

**Visual Elements:**
- Centered card with max-width: 28rem (md)
- Red X circle icon (w-16 h-16) in danger/10 background
- "Form Not Available" heading (text-xl, bold)
- Error message explaining the issue
- "Return to Home" button (flat variant)

**User Guidance:**
"Please contact the school administration for assistance"

**Code Reference:**
```jsx
{!formData.formDetails && (
  <Card className="max-w-md w-full shadow-xl">
    <CardBody className="p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-danger" />
      </div>
      <h2 className="text-xl font-bold">Form Not Available</h2>
      {/* Error message and CTA */}
    </CardBody>
  </Card>
)}
```

---

## State 3: Already Submitted
**When:** Parent has already submitted this form

**Visual Elements:**
- Centered card with max-width: 28rem (md)
- Green checkmark icon (w-16 h-16) in success/10 background
- "Already Submitted" heading
- Submission date and time (formatted with date-fns)
- Submitter name (if available)
- No action buttons (informational only)

**Code Reference:**
```jsx
{formData.submissionStatus?.submitted && (
  <Card className="max-w-md w-full shadow-xl">
    <CardBody className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-success/10">
        <CheckCircle className="w-8 h-8 text-success" />
      </div>
      <h2 className="text-xl font-bold">Already Submitted</h2>
      <p>Submitted on {format(date, "MMMM d, yyyy 'at' h:mm a")}</p>
    </CardBody>
  </Card>
)}
```

---

## State 4: Success
**When:** Form submission completed successfully

**Visual Elements:**
- Centered card with max-width: 28rem (md)
- Large bouncing checkmark (w-20 h-20) with gradient background
- "Thank You!" heading with gradient text (success → primary)
- Success message
- Submission timestamp
- Form title and submission time

**Animation:**
- Icon has `animate-bounce` class for celebration effect
- Gradient background from success/20 to primary/20

**Code Reference:**
```jsx
{submitted && (
  <Card className="max-w-md w-full shadow-xl">
    <CardBody className="p-8 text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br animate-bounce">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>
      <h2 className="text-2xl font-bold bg-gradient-to-r...">
        Thank You!
      </h2>
      <p>Your form has been submitted successfully...</p>
    </CardBody>
  </Card>
)}
```

---

## State 5: Main Form
**When:** Token is valid, form can be submitted

### Header Card
- Gradient icon (primary → secondary) with FileText icon
- Form title (text-2xl, bold, gradient text)
- Form description (if available)
- Deadline info with Clock icon (if applicable)
- Expired warning chip (if applicable)

### Form Card
- Dynamic fields rendered based on `formStructure`
- Each field type has specific rendering
- Validation errors shown below fields
- Required fields marked with red asterisk

#### Field Types:

**Text/Email/Phone/Number:**
```jsx
<Input
  label="Field Label"
  placeholder="Enter value"
  value={value}
  onValueChange={(v) => handleFieldChange(field.id, v)}
  isRequired={field.required}
  variant="bordered"
/>
```

**Textarea:**
```jsx
<Textarea
  label="Field Label"
  placeholder="Enter description"
  minRows={3}
  variant="bordered"
/>
```

**Date:**
```jsx
<Input
  type="date"
  label="Field Label"
  variant="bordered"
/>
```

**Select:**
```jsx
<select className="px-3 py-2 rounded-lg border">
  <option value="">Select an option</option>
  {options.map(opt => <option value={opt.value}>{opt.label}</option>)}
</select>
```

**Checkbox:**
```jsx
<div className="flex items-start gap-3 p-3 rounded-lg bg-default-50/50">
  <input type="checkbox" />
  <label>{field.label}</label>
</div>
```

### Footer
- Divider above footer
- "Required fields" note on left
- Submit button on right (primary color, shadow-lg, isLoading state)

**Code Reference:**
```jsx
<Card className="shadow-lg border border-default-200">
  <CardBody className="p-6">
    <form onSubmit={handleSubmit} className="space-y-6">
      {formDetails.formStructure?.map(field => renderField(field))}

      <Divider />

      <div className="flex items-center justify-between">
        <p className="text-sm text-default-500">
          <span className="text-danger">*</span> Required fields
        </p>
        <Button
          type="submit"
          color="primary"
          isLoading={submitting}
        >
          Submit Form
        </Button>
      </div>
    </form>
  </CardBody>
</Card>
```

---

## Background Effects

### Gradient
```jsx
bg-gradient-to-br from-default-50 via-background to-default-100
dark:from-default-950 dark:via-background dark:to-default-900
```

### Ambient Blobs (Fixed, Full Screen)
```jsx
<div className="fixed inset-0 overflow-hidden pointer-events-none">
  <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
</div>
```

---

## Responsive Breakpoints

### Mobile (< 768px)
- Full width cards
- Reduced padding (p-4)
- Single column layout
- Stacked buttons on small screens

### Tablet (768px - 1024px)
- max-w-2xl (32rem) on main container
- Maintains spacing
- Horizontal layouts for buttons/fields

### Desktop (> 1024px)
- max-w-2xl (32rem) on main container
- Generous spacing (space-y-6)
- Enhanced shadow effects

---

## Color Palette

### Primary Colors
- Primary: Blue/violet accent
- Secondary: Complementary accent
- Success: Green (#10b981)
- Danger: Red (#ef4444)
- Warning: Amber/Orange

### Neutral Colors
- Default-50: Light background
- Default-100: Slightly darker background
- Default-200: Borders
- Default-400: Hover states
- Default-500: Text secondary
- Foreground: Primary text

### Opacity Levels
- /5: Very subtle backgrounds
- /10: Icon backgrounds
- /20: Enhanced shadows
- /70: Secondary text
- /50: Disabled states

---

## Animation Classes

### Tailwind Animations Used
- `animate-spin` - Loading spinner
- `animate-bounce` - Success icon
- `animate-pulse` - Background blobs
- `transition-colors` - Smooth color changes
- `transition-all` - All property transitions

### Custom Animation Delays
- `animation-delay-2000` - Second blob
- `animation-delay-1000` - Pulse delay

---

## Accessibility Features

### ARIA Labels
- Icons have meaningful labels
- Form fields have proper labels
- Error messages are announced
- Required fields clearly marked

### Keyboard Navigation
- All inputs are keyboard accessible
- Tab order follows visual flow
- Enter key submits forms
- Escape closes modals (if added)

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Descriptive link text
- Error messages in context

### Focus States
- Visible focus rings on all interactive elements
- `focus:outline-none focus:ring-2` pattern
- High contrast focus indicators

---

## Validation States

### Error State
```jsx
isInvalid={!!error}
errorMessage={error}
className="border-danger"
```

### Success State (Implicit)
- No error message displayed
- Field validates on change
- Submission button enables

### Required Field Indicator
```jsx
{field.required && <span className="text-danger ml-1">*</span>}
```

---

## Toast Notifications

### Success Toast
```jsx
toast.success("Form submitted successfully!");
// Green icon, 3s duration
```

### Error Toast
```jsx
toast.error("Failed to submit form. Please try again.");
// Red icon, 4s duration
```

### Validation Toast
```jsx
toast.error("Please fill in all required fields correctly");
// Shows before submission attempt
```

---

This visual guide ensures consistency and helps maintain the design system across the application.
