import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { cn } from '@/utils/cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});

describe('Balance formatting', () => {
  it('should format numbers with locale', () => {
    const value = 1234.56;
    expect(value.toLocaleString('en-US', { minimumFractionDigits: 2 })).toBe('1,234.56');
  });

  it('should mask balance when hidden', () => {
    const mask = (v: number, visible: boolean) => 
      visible ? v.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••';
    expect(mask(100, false)).toBe('••••••');
    expect(mask(100, true)).toBe('100.00');
  });
});

describe('Referral code validation', () => {
  const validateCode = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { valid: false, message: 'Codice obbligatorio' };
    if (!normalized.startsWith('VYRO-')) return { valid: false, message: 'Formato non valido' };
    return { valid: true, message: 'ok' };
  };

  it('should reject empty code', () => {
    expect(validateCode('').valid).toBe(false);
  });

  it('should reject invalid format', () => {
    expect(validateCode('INVALID').valid).toBe(false);
  });

  it('should accept valid code', () => {
    expect(validateCode('VYRO-ABC123').valid).toBe(true);
  });
});
