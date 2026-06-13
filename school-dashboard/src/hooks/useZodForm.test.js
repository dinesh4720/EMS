// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';

import useZodForm from './useZodForm';

const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.coerce.number().min(0, 'Age must be 0 or greater').optional(),
});

function Wrapper({ children }) {
  return children;
}

describe('useZodForm', () => {
  it('returns react-hook-form controls and project helpers', () => {
    const { result } = renderHook(
      () => useZodForm(testSchema, { defaultValues: { name: '', email: '', age: '' } }),
      { wrapper: Wrapper }
    );

    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.handleSubmit).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.setValue).toBe('function');
    expect(typeof result.current.watch).toBe('function');
    expect(typeof result.current.setServerErrors).toBe('function');
    expect(typeof result.current.onInvalid).toBe('function');
    expect(result.current.errors).toEqual({});
  });

  it('validates fields on submit and exposes Zod error messages', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(
      () => useZodForm(testSchema, { defaultValues: { name: '', email: '', age: '' } }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.handleSubmit(onSubmit, result.current.onInvalid)({
        preventDefault: () => {},
      });
    });

    await waitFor(() => {
      expect(result.current.errors.name?.message).toBe('Name must be at least 2 characters');
      expect(result.current.errors.email?.message).toBe('Invalid email address');
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with parsed data when validation passes', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(
      () => useZodForm(testSchema, { defaultValues: { name: '', email: '', age: '' } }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setValue('name', 'Alice');
      result.current.setValue('email', 'alice@school.edu');
      result.current.setValue('age', '12');
    });

    act(() => {
      result.current.handleSubmit(onSubmit, result.current.onInvalid)({
        preventDefault: () => {},
      });
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe('Alice');
    expect(submitted.email).toBe('alice@school.edu');
    expect(submitted.age).toBe(12);
  });

  it('reset clears values and errors', async () => {
    const { result } = renderHook(
      () => useZodForm(testSchema, { defaultValues: { name: '', email: '', age: '' } }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setValue('name', 'A');
      result.current.handleSubmit(() => {}, result.current.onInvalid)({
        preventDefault: () => {},
      });
    });

    await waitFor(() => {
      expect(result.current.errors.name).toBeDefined();
    });

    act(() => {
      result.current.reset({ name: '', email: '', age: '' });
    });

    await waitFor(() => {
      expect(result.current.errors).toEqual({});
      expect(result.current.getValues('name')).toBe('');
    });
  });

  it('maps server field errors via setServerErrors', async () => {
    const { result } = renderHook(
      () => useZodForm(testSchema, { defaultValues: { name: '', email: '', age: '' } }),
      { wrapper: Wrapper }
    );

    let message;
    act(() => {
      message = result.current.setServerErrors({
        fieldErrors: { email: 'This email is already registered' },
        message: 'Please correct the highlighted fields.',
      });
    });

    await waitFor(() => {
      expect(result.current.errors.email?.message).toBe('This email is already registered');
    });
    expect(message).toBe('Please correct the highlighted fields.');
  });

  it('maps Zod-style server issues via setServerErrors', async () => {
    const { result } = renderHook(
      () => useZodForm(testSchema, { defaultValues: { name: '', email: '', age: '' } }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.setServerErrors({
        issues: [{ path: ['name'], message: 'Server rejected this name' }],
      });
    });

    await waitFor(() => {
      expect(result.current.errors.name?.message).toBe('Server rejected this name');
    });
  });
});
