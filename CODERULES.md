# Code Standards & Best Practices Guide

**Version:** 1.0  
**Last Updated:** 2026-02-02  
**Applies To:** All React/Node.js Projects in EMS

---

## Table of Contents

1. [Code Architecture](#1-code-architecture)
2. [React Best Practices](#2-react-best-practices)
3. [Performance Guidelines](#3-performance-guidelines)
4. [Error Handling Standards](#4-error-handling-standards)
5. [State Management Patterns](#5-state-management-patterns)
6. [Testing Strategy](#6-testing-strategy)
7. [Modern React Adoption](#7-modern-react-adoption)
8. [API Layer Standards](#8-api-layer-standards)
9. [Developer Experience](#9-developer-experience)
10. [Code Organization](#10-code-organization)
11. [Security Best Practices](#11-security-best-practices)

---

## 1. Code Architecture

### 1.1 Component Size Rule
**RULE:** No single component file should exceed 300 lines of code.

```javascript
// ❌ BAD: God component (2500+ lines)
function AddStudent() {
  // 50+ state variables
  // 30+ handlers
  // 3 massive render functions
  // 2000+ lines total
}

// ✅ GOOD: Component composition
function AddStudent() {
  const { formData, updateField } = useStudentForm();
  const steps = [
    { component: PersonalInfoStep, validate: validatePersonal },
    { component: ParentsStep, validate: validateParents },
    { component: DocumentsStep, validate: validateDocuments }
  ];
  
  return <Wizard steps={steps} formData={formData} onChange={updateField} />;
}
```

### 1.2 Feature-Based Folder Structure
**RULE:** All new features MUST follow this structure:

```
src/features/{featureName}/
├── api/                    # API calls and queries
│   ├── {feature}Api.ts
│   └── queries.ts
├── components/             # Feature-specific components
│   ├── {Component}/
│   │   ├── index.tsx
│   │   ├── Component.tsx
│   │   └── Component.test.tsx
├── hooks/                  # Custom hooks
│   └── use{Feature}.ts
├── types/                  # TypeScript types
│   └── {feature}.types.ts
├── constants/              # Feature constants
│   └── {feature}.constants.ts
├── utils/                  # Utility functions
│   └── {feature}.utils.ts
└── index.ts               # Public exports
```

### 1.3 Single Responsibility Principle
**RULE:** Each function/component should do ONE thing.

```javascript
// ❌ BAD: Multiple responsibilities
function handleStudentSubmit(data) {
  // Validate
  const errors = validateData(data);
  if (errors) return errors;
  
  // Transform
  const transformed = transformData(data);
  
  // Upload files
  const uploads = await uploadFiles(data.files);
  
  // API call
  await api.post('/students', transformed);
  
  // Update local state
  setStudents([...students, transformed]);
  
  // Show notification
  toast.success('Student added');
  
  // Analytics
  trackEvent('student_created');
}

// ✅ GOOD: Separated concerns
const useStudentSubmission = () => {
  const { validate } = useStudentValidation();
  const { transform } = useStudentTransform();
  const { upload } = useFileUpload();
  const { create } = useCreateStudent();
  
  return async (data) => {
    const validated = validate(data);
    const transformed = transform(validated);
    const uploads = await upload(data.files);
    return create({ ...transformed, uploads });
  };
};
```

### 1.4 Props Interface Rule
**RULE:** All components MUST define explicit prop interfaces.

```typescript
// ✅ GOOD: Explicit props with defaults
interface StudentCardProps {
  student: Student;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function StudentCard({ 
  student, 
  showActions = true,  // Default value
  onEdit,
  onDelete,
  className = ''
}: StudentCardProps) {
  // Component logic
}
```

---

## 2. React Best Practices

### 2.1 Hook Dependencies Rule
**RULE:** All `useEffect`, `useCallback`, `useMemo` MUST have exhaustive dependencies.

```javascript
// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchStudent(studentId);
}, []); // Missing: studentId

// ❌ BAD: Lying about dependencies
useEffect(() => {
  fetchStudent(studentId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ✅ GOOD: Complete dependencies
useEffect(() => {
  fetchStudent(studentId);
}, [studentId]);

// ✅ GOOD: Functional update when appropriate
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1); // No dependency needed
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### 2.2 Memoization Strategy
**RULE:** Use memoization strategically, not everywhere.

```javascript
// ❌ BAD: Unnecessary memoization
const StudentName = React.memo(({ name }) => <span>{name}</span>);

// ✅ GOOD: Memoize expensive computations
const filteredStudents = useMemo(() => {
  return students
    .filter(s => filters.class === 'all' || s.class === filters.class)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [students, filters.class]);

// ✅ GOOD: Memoize callbacks passed to children
const handleStudentUpdate = useCallback((id, data) => {
  updateStudent(id, data);
  invalidateCache(['students']);
}, [updateStudent, invalidateCache]);

// ✅ GOOD: Memoize components that render large lists
const StudentRow = React.memo(function StudentRow({ student, onUpdate }) {
  return (
    <tr>
      <td>{student.name}</td>
      <td><button onClick={() => onUpdate(student.id)}>Edit</button></td>
    </tr>
  );
}, (prev, next) => prev.student.id === next.student.id);
```

### 2.3 State Co-location Rule
**RULE:** Keep state as close to where it's used as possible.

```javascript
// ❌ BAD: Lifting state unnecessarily
// AppContext.jsx
const [formInput, setFormInput] = useState(''); // Only used in SearchBar

// ✅ GOOD: State in component that uses it
function SearchBar({ onSearch }) {
  const [input, setInput] = useState('');
  return <input value={input} onChange={e => setInput(e.target.value)} />;
}
```

### 2.4 Context Splitting Rule
**RULE:** Split contexts by concern to prevent unnecessary re-renders.

```javascript
// ❌ BAD: Single massive context
const AppContext = createContext(); // 20+ values

// ✅ GOOD: Split by concern
const StudentDataContext = createContext();
const StudentActionsContext = createContext();
const StudentFiltersContext = createContext();

// Usage - only re-renders when relevant data changes
function StudentList() {
  const students = useContext(StudentDataContext);
  const filters = useContext(StudentFiltersContext);
  // Won't re-render when actions change
}
```

### 2.5 Event Handler Naming
**RULE:** Use consistent naming: `handle[Event][Element]` or `on[Action]`.

```javascript
// ✅ GOOD: Consistent naming
function StudentForm() {
  const handleSubmit = useCallback(() => { ... }, []);
  const handleNameChange = useCallback((e) => { ... }, []);
  const handleCancelClick = useCallback(() => { ... }, []);
  
  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleNameChange} />
      <button onClick={handleCancelClick}>Cancel</button>
    </form>
  );
}
```

---

## 3. Performance Guidelines

### 3.1 List Virtualization Rule
**RULE:** Lists with >50 items MUST use virtualization.

```javascript
// ✅ GOOD: Virtualized list
import { FixedSizeList as List } from 'react-window';

function StudentList({ students }) {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <StudentRow student={students[index]} />
    </div>
  ), [students]);

  return (
    <List
      height={600}
      itemCount={students.length}
      itemSize={72}
    >
      {Row}
    </List>
  );
}
```

### 3.2 Image Optimization Rule
**RULE:** All images MUST use optimized formats and lazy loading.

```javascript
// ✅ GOOD: Optimized images
function StudentAvatar({ photo, name }) {
  return (
    <img
      src={photo}
      alt={`${name}'s photo`}
      loading="lazy"
      width={64}
      height={64}
      style={{ objectFit: 'cover' }}
      onError={(e) => {
        e.target.src = '/fallback-avatar.png';
      }}
    />
  );
}

// ✅ GOOD: Responsive images with Cloudinary
function ResponsivePhoto({ publicId }) {
  return (
    <img
      src={`https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill/${publicId}`}
      srcSet={`
        https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_fill/${publicId} 150w,
        https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill/${publicId} 300w,
        https://res.cloudinary.com/demo/image/upload/w_600,h_600,c_fill/${publicId} 600w
      `}
      sizes="(max-width: 600px) 150px, 300px"
      alt="Student photo"
    />
  );
}
```

### 3.3 Code Splitting Rule
**RULE:** Use dynamic imports for routes and heavy components.

```javascript
// ✅ GOOD: Route-based code splitting
import { lazy, Suspense } from 'react';

const StudentList = lazy(() => import('./features/students/StudentList'));
const StudentProfile = lazy(() => import('./features/students/StudentProfile'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/:id" element={<StudentProfile />} />
      </Routes>
    </Suspense>
  );
}

// ✅ GOOD: Component-level splitting
const PhotoEditor = lazy(() => import('./components/PhotoEditor'));

function StudentForm() {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <div>
      {showEditor && (
        <Suspense fallback={<Spinner />}>
          <PhotoEditor />
        </Suspense>
      )}
    </div>
  );
}
```

### 3.4 Debounce/Throttle Rule
**RULE:** Debounce all user input that triggers expensive operations.

```javascript
// ✅ GOOD: Debounced search
import { useDebouncedCallback } from 'use-debounce';

function SearchField({ onSearch }) {
  const debouncedSearch = useDebouncedCallback(
    (value) => onSearch(value),
    300
  );
  
  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search students..."
    />
  );
}

// ✅ GOOD: Throttled scroll handler
import { useThrottledCallback } from 'use-debounce';

function InfiniteList({ onLoadMore }) {
  const throttledLoad = useThrottledCallback(
    () => onLoadMore(),
    200
  );
  
  return (
    <div onScroll={throttledLoad}>
      {/* list content */}
    </div>
  );
}
```

---

## 4. Error Handling Standards

### 4.1 Error Boundary Implementation
**RULE:** All route-level components MUST be wrapped in Error Boundaries.

```javascript
// ✅ GOOD: Error Boundary
class FeatureErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          featureName={this.props.featureName}
        />
      );
    }
    return this.props.children;
  }
}

// Usage
<FeatureErrorBoundary featureName="Student Management">
  <StudentModule />
</FeatureErrorBoundary>
```

### 4.2 Async Error Handling
**RULE:** All async operations MUST have try-catch with user feedback.

```javascript
// ❌ BAD: Unhandled promise
const handleSubmit = async (data) => {
  await api.post('/students', data); // May throw
  toast.success('Student added');
};

// ✅ GOOD: Proper error handling
const handleSubmit = async (data) => {
  try {
    setIsSubmitting(true);
    const result = await api.post('/students', data);
    toast.success('Student added successfully');
    return result;
  } catch (error) {
    const message = error.message || 'Failed to add student';
    toast.error(message);
    console.error('Student creation error:', error);
    throw error; // Re-throw for caller if needed
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4.3 Schema Validation
**RULE:** All form inputs MUST be validated with Zod schemas.

```javascript
// ✅ GOOD: Zod validation
import { z } from 'zod';

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  classId: z.string().min(1, 'Class is required'),
  parents: z.array(z.object({
    name: z.string().min(1, 'Parent name is required'),
    phone: z.string().regex(/^\d{10}$/, 'Invalid phone'),
  })).min(1, 'At least one parent required'),
});

// Usage with React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(studentSchema),
});
```

---

## 5. State Management Patterns

### 5.1 Server State vs UI State
**RULE:** Separate server state (React Query) from UI state (Zustand/Context).

```javascript
// ✅ GOOD: Server state with React Query
function useStudents(filters) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000,
  });
}

// ✅ GOOD: UI state with Zustand
const useStudentStore = create((set) => ({
  selectedId: null,
  filters: { class: 'all', status: 'active' },
  setSelectedId: (id) => set({ selectedId: id }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
}));
```

### 5.2 Mutation Patterns
**RULE:** Use mutations for all data modifications with optimistic updates.

```javascript
// ✅ GOOD: Mutation with optimistic update
function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => studentsApi.update(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['student', id]);
      const previous = queryClient.getQueryData(['student', id]);
      queryClient.setQueryData(['student', id], (old) => ({ ...old, ...data }));
      return { previous };
    },
    
    // Rollback on error
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['student', id], context.previous);
      toast.error('Update failed');
    },
    
    // Refetch after success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries(['student', id]);
    },
  });
}
```

### 5.3 Form State Management
**RULE:** Use React Hook Form for all forms.

```javascript
// ✅ GOOD: React Hook Form
import { useForm, useFieldArray } from 'react-hook-form';

function StudentForm({ initialData, onSubmit }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    watch,
    reset,
  } = useForm({
    defaultValues: initialData || emptyForm,
    resolver: zodResolver(studentSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parents',
  });

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`parents.${index}.name`)} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => append({ name: '', relationship: 'Father' })}
      >
        Add Parent
      </button>
      
      <button type="submit" disabled={isSubmitting || !isDirty}>
        Submit
      </button>
    </form>
  );
}
```

---

## 6. Testing Strategy

### 6.1 Test File Organization
**RULE:** Co-locate tests with source files.

```
src/
├── features/
│   └── students/
│       ├── components/
│       │   └── StudentCard/
│       │       ├── index.ts
│       │       ├── StudentCard.tsx
│       │       └── StudentCard.test.tsx  # ✅ Co-located
```

### 6.2 Unit Test Standards
**RULE:** All utilities and hooks MUST have unit tests.

```javascript
// ✅ GOOD: Unit test for utility
import { normalizeStudentData } from './student.utils';

describe('normalizeStudentData', () => {
  it('converts date format from DD/MM/YYYY to ISO', () => {
    const input = { dateOfBirth: '15/03/2010' };
    const result = normalizeStudentData(input);
    expect(result.dateOfBirth).toBe('2010-03-15');
  });

  it('handles missing optional fields', () => {
    const input = { name: 'John' };
    const result = normalizeStudentData(input);
    expect(result.parents).toEqual([]);
  });
});
```

### 6.3 Component Test Standards
**RULE:** All components MUST have integration tests.

```javascript
// ✅ GOOD: Component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentForm } from './StudentForm';

describe('StudentForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<StudentForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.click(screen.getByText(/submit/i));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com'
      }));
    });
  });

  it('shows validation errors for invalid data', async () => {
    render(<StudentForm onSubmit={jest.fn()} />);
    
    fireEvent.click(screen.getByText(/submit/i));
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });
});
```

### 6.4 Mock Service Worker Setup
**RULE:** Use MSW for all API mocking in tests.

```javascript
// tests/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/students', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', name: 'Student 1' },
      { id: '2', name: 'Student 2' },
    ]));
  }),
  
  rest.post('/api/students', (req, res, ctx) => {
    return res(ctx.json({ id: '3', ...req.body }));
  }),
];

// tests/setup.js
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 7. Modern React Adoption

### 7.1 Suspense for Data Fetching
**RULE:** Use Suspense for all async components.

```javascript
// ✅ GOOD: Suspense with React Query
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

function StudentProfile({ studentId }) {
  return (
    <ErrorBoundary fallback={<ProfileError />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <StudentProfileContent studentId={studentId} />
      </Suspense>
    </ErrorBoundary>
  );
}

function StudentProfileContent({ studentId }) {
  const { data: student } = useSuspenseQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsApi.getById(studentId),
  });
  
  return <div>{student.name}</div>;
}
```

### 7.2 Server Components (Next.js)
**RULE:** Use Server Components for data-heavy pages when using Next.js.

```javascript
// ✅ GOOD: Server Component
// app/students/page.tsx
async function getStudents() {
  const res = await fetch('http://api/students', { cache: 'no-store' });
  return res.json();
}

export default async function StudentsPage() {
  const students = await getStudents();
  
  return (
    <div>
      <h1>Students</h1>
      <StudentList initialData={students} />
    </div>
  );
}
```

---

## 8. API Layer Standards

### 8.1 Centralized API Client
**RULE:** Use a single API client instance for all requests.

```javascript
// lib/api/client.js
class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.getToken = config.getToken;
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.message, response.status);
    }

    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  getToken: () => {
    const user = sessionStorage.getItem('app_user');
    return user ? JSON.parse(user).token : null;
  },
});
```

### 8.2 Feature API Modules
**RULE:** Create dedicated API modules for each feature.

```javascript
// features/students/api/studentsApi.js
export const studentsApi = {
  getAll: (filters) => 
    apiClient.get(`/students?${new URLSearchParams(filters)}`),
  
  getById: (id) => 
    apiClient.get(`/students/${id}`),
  
  create: (data) => 
    apiClient.post('/students', data),
  
  update: (id, data) => 
    apiClient.put(`/students/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`/students/${id}`),
  
  bulkUpdate: (ids, data) => 
    apiClient.patch('/students/bulk', { ids, data }),
  
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/students/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
```

### 8.3 Request/Response Types
**RULE:** Define TypeScript types for all API operations.

```typescript
// features/students/types/studentApi.types.ts
export interface GetStudentsParams {
  class?: string;
  status?: 'active' | 'inactive' | 'transferred' | 'alumni';
  feeStatus?: 'paid' | 'pending' | 'overdue' | 'partial';
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetStudentsResponse {
  data: Student[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateStudentRequest {
  name: string;
  classId: string;
  rollNo: number;
  parents: Parent[];
  // ... other fields
}

export interface ApiError {
  message: string;
  status: number;
  code: string;
}
```

---

## 9. Developer Experience

### 9.1 ESLint Configuration
**RULE:** Use strict ESLint rules with automatic fixing.

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'react-hooks/exhaustive-deps': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unstable-nested-components': 'error',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    }],
  },
};
```

### 9.2 Pre-commit Hooks
**RULE:** All code must pass linting and formatting before commit.

```json
// .husky/pre-commit
{
  "hooks": {
    "pre-commit": "lint-staged"
  }
}

// lint-staged.config.js
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
};
```

### 9.3 Absolute Imports
**RULE:** Use absolute imports with path aliases.

```javascript
// tsconfig.json or jsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/utils/*": ["src/utils/*"],
      "@/hooks/*": ["src/hooks/*"],
    }
  }
}

// Usage
import { Button } from '@/components/ui/Button';
import { useStudents } from '@/features/students/hooks/useStudents';
import { formatDate } from '@/utils/date';
```

---

## 10. Code Organization

### 10.1 Import Order
**RULE:** Follow strict import ordering.

```javascript
// ✅ GOOD: Ordered imports
// 1. React and third-party libraries
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 2. Absolute imports
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 3. Relative imports from parent
import { StudentCard } from '../StudentCard';
import { useStudentForm } from '../hooks/useStudentForm';

// 4. Relative imports from same directory
import { StudentHeader } from './StudentHeader';
import { StudentDetails } from './StudentDetails';
import styles from './StudentProfile.module.css';
```

### 10.2 File Naming Conventions
**RULE:** Use consistent naming throughout.

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StudentCard.jsx` |
| Hooks | camelCase with use prefix | `useStudentForm.js` |
| Utilities | camelCase | `studentUtils.js` |
| Constants | SCREAMING_SNAKE_CASE | `STUDENT_STATUSES.js` |
| Types | PascalCase with .types.ts | `student.types.ts` |
| Tests | Same as source + .test | `StudentCard.test.jsx` |
| Styles | Same as source + .module.css | `StudentCard.module.css` |

---

## 11. Security Best Practices

### 11.1 XSS Prevention
**RULE:** Sanitize all user-generated content before rendering.

```javascript
// ✅ GOOD: Sanitize HTML
import DOMPurify from 'dompurify';

function StudentNotes({ notes }) {
  const sanitized = DOMPurify.sanitize(notes);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// ✅ GOOD: Avoid dangerouslySetInnerHTML when possible
function StudentBio({ bio }) {
  // Use text content when possible
  return <p>{bio}</p>;
}
```

### 11.2 File Upload Security
**RULE:** Validate all file uploads on client and server.

```javascript
// ✅ GOOD: Secure file upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPG, PNG, PDF');
  }
  
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum: 5MB');
  }
  
  // Check file extension
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
    throw new Error('Invalid file extension');
  }
  
  return true;
}
```

### 11.3 Storage Security
**RULE:** Never store sensitive data in localStorage.

```javascript
// ❌ BAD: Sensitive in localStorage
localStorage.setItem('token', jwtToken);

// ✅ GOOD: Use httpOnly cookies (set by server)
// Or sessionStorage with caution
sessionStorage.setItem('app_user', JSON.stringify({ 
  id: user.id, 
  name: user.name 
  // NO tokens, NO passwords
}));
```

### 11.4 Input Validation
**RULE:** Never trust user input; validate everything.

```javascript
// ✅ GOOD: Validate all inputs
function createStudent(data) {
  // Schema validation
  const validated = studentSchema.parse(data);
  
  // Business logic validation
  if (validated.dateOfBirth) {
    const age = calculateAge(validated.dateOfBirth);
    if (age < 3 || age > 25) {
      throw new Error('Invalid age for student');
    }
  }
  
  // Duplicate check
  const exists = await checkDuplicateStudent(validated.admissionId);
  if (exists) {
    throw new Error('Student with this admission ID already exists');
  }
  
  return db.students.create(validated);
}
```

---

## Quick Reference Checklist

### Before Committing Code:

- [ ] Component is under 300 lines
- [ ] All hooks have exhaustive dependencies
- [ ] Props are typed with TypeScript
- [ ] Error boundaries wrap async components
- [ ] Tests cover critical paths
- [ ] No console.log statements (only console.error)
- [ ] ESLint passes with no warnings
- [ ] No hardcoded strings (use constants)
- [ ] All user inputs are validated
- [ ] File uploads have size/type checks

### Code Review Checklist:

- [ ] Architecture follows feature-based structure
- [ ] State management uses appropriate tool (React Query for server, Zustand for UI)
- [ ] Components are properly memoized
- [ ] Lists use virtualization if >50 items
- [ ] API calls use centralized client
- [ ] Security best practices followed
- [ ] Performance optimizations applied
- [ ] Accessibility (a11y) considered

---

**Document Owner:** Engineering Team  
**Review Cycle:** Monthly  
**Enforcement:** ESLint + Pre-commit hooks
