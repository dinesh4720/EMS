# Staff App Fix Plan

**Generated:** 2026-02-10
**Based on:** UI, UX, Dev, and QA Analysis

---

## Executive Summary

| Priority | Issues | Estimated Effort |
|----------|--------|------------------|
| 🔴 Critical | 5 | 2-3 days |
| 🟡 High | 12 | 1-2 weeks |
| 🟢 Medium | 8 | 1 week |

---

## Phase 1: Critical Fixes (Week 1)

### 1.1 Fix ProfileFormField ThemeContext Issue

**File:** `staff-app/src/components/ProfileFormField.tsx`

**Problem:** Component uses hardcoded colors instead of ThemeContext, breaking dark mode.

**Solution:**
```tsx
// BEFORE (hardcoded):
const styles = StyleSheet.create({
  input: { backgroundColor: '#F7F7F7', color: '#333' }
});

// AFTER (theme-aware):
const styles = (colors) => StyleSheet.create({
  input: { backgroundColor: colors.inputBackground, color: colors.text }
});
```

**Acceptance Criteria:**
- [ ] All colors use ThemeContext
- [ ] Works in both light and dark modes
- [ ] No hardcoded hex values remain

---

### 1.2 Create Design Token System

**New File:** `staff-app/src/constants/designTokens.ts`

**Solution:**
```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
};

export const ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};
```

**Acceptance Criteria:**
- [ ] Design tokens created and exported
- [ ] Documented in STYLE_GUIDE.md
- [ ] Used in at least 3 components as proof of concept

---

### 1.3 Add Date Picker to Leave Application

**File:** `staff-app/src/components/LeaveApplicationModal.tsx`

**Problem:** Users must manually type dates in YYYY-MM-DD format.

**Solution:**
```tsx
import DateTimePicker from '@react-native-community/datetimepicker';

// Replace TextInput with DateTimePicker
<DateTimePicker
  value={startDate}
  mode="date"
  display="default"
  onChange={(event, date) => setStartDate(date)}
  minimumDate={new Date()}
/>
```

**Acceptance Criteria:**
- [ ] DateTimePicker integrated for start/end dates
- [ ] Date validation ensures end date >= start date
- [ ] Formatted display shows readable date format

---

### 1.4 Add Basic Test Infrastructure

**New Files:**
- `staff-app/jest.config.js`
- `staff-app/package.json` (add test scripts)

**Solution:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

**Acceptance Criteria:**
- [ ] Jest configured
- [ ] First test written for API service
- [ ] Test coverage report generates

---

### 1.5 Refactor Dashboard Component

**File:** `staff-app/src/app/(tabs)/index.tsx`

**Problem:** 824 lines, too large to maintain.

**Solution:** Extract sub-components:
```
components/
  dashboard/
    AttendanceCard.tsx
    ScheduleCard.tsx
    QuickActionsGrid.tsx
    NotificationsSection.tsx
    StatsOverview.tsx
```

**Acceptance Criteria:**
- [ ] Dashboard file under 300 lines
- [ ] Each sub-component under 150 lines
- [ ] No functionality broken

---

## Phase 2: High Priority Fixes (Week 2)

### 2.1 Replace Hardcoded Colors with Theme

**Files:** All component files

**Action:** Find and replace hardcoded colors:
```bash
# Search for these patterns:
- '#E31C5F' → colors.primary
- '#00A699' → colors.success
- '#FF5A5F' → colors.error
- '#F5A623' → colors.warning
- '#FFFFFF' → colors.white
- '#F7F7F7' → colors.inputBackground
- '#333333' → colors.text
```

### 2.2 Add API Retry Logic

**File:** `staff-app/src/services/api.ts`

**Solution:**
```typescript
async fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await this.fetchWithTimeout(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

### 2.3 Add Inline Form Validation

**Files:** `edit-profile.tsx`, `LeaveApplicationModal.tsx`, `homework.tsx`

**Replace:** `Alert.alert()` errors → Inline error messages

**Solution:**
```tsx
<Controller
  name="email"
  control={control}
  render={({ field, fieldState }) => (
    <>
      <TextInput {...field} />
      {fieldState.error && (
        <Text style={styles.error}>{fieldState.error.message}</Text>
      )}
    </>
  )}
/>
```

### 2.4 Add Accessibility Labels

**Files:** All screens with icon-only buttons

**Solution:**
```tsx
<TouchableOpacity
  accessibilityLabel="Go back"
  accessibilityRole="button"
  onPress={handleBack}
>
  <Ionicons name="arrow-back" />
</TouchableOpacity>
```

### 2.5 Fix Performance Issues

**Files:** `attendance.tsx`, `timetable.tsx`

**Solutions:**
```tsx
// Memoize list items
const StudentRow = React.memo(({ student, onToggle }) => {
  // ...
});

// Use FlatList instead of ScrollView
<FlatList
  data={students}
  renderItem={({ item }) => <StudentRow student={item} />}
  keyExtractor={(item) => item.id}
/>
```

---

## Phase 3: Test Coverage (Week 3)

### 3.1 API Service Tests
**File:** `staff-app/src/services/__tests__/api.test.ts`

### 3.2 AuthContext Tests
**File:** `staff-app/src/context/__tests__/AuthContext.test.tsx`

### 3.3 Validation Schema Tests
**File:** `staff-app/src/utils/__tests__/validation.test.ts`

### 3.4 Component Tests
**File:** `staff-app/src/components/__tests__/ProfileFormField.test.tsx`

---

## Implementation Order

```
Day 1-2: Design tokens + ProfileFormField fix
Day 3: Date picker integration
Day 4: Dashboard refactoring
Day 5: Test infrastructure setup

Week 2: High priority fixes (colors, validation, performance)
Week 3: Test coverage expansion
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Thorough testing after each fix |
| Design token adoption takes time | Incremental migration, start new |
| Test setup complexity | Use proven React Native testing libs |
| Performance regressions | Benchmark before/after key changes |

---

## Success Metrics

- [ ] All critical issues resolved
- [ ] Theme works in light/dark mode
- [ ] Dashboard file < 300 lines
- [ ] Test coverage > 30%
- [ ] No hardcoded colors in new code
- [ ] All forms have inline validation
- [ ] Accessibility labels on all interactive elements
