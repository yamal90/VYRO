/**
 * Security utilities for VYRO platform.
 * Input sanitization, rate limiting, and validation.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(action: string): boolean {
  const now = Date.now();
  const entry = attempts.get(action);

  if (!entry || now > entry.resetAt) {
    attempts.set(action, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[<>"']/g, '');
}

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Minimo 8 caratteri');
  }
  if (password.length > 128) {
    errors.push('Massimo 128 caratteri');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Almeno una lettera maiuscola');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Almeno una lettera minuscola');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Almeno un numero');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Almeno un carattere speciale (!@#$%...)');
  }
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Troppi caratteri ripetuti consecutivi');
  }

  return { valid: errors.length === 0, errors };
}

export function validateUsername(username: string): { valid: boolean; message: string } {
  const trimmed = username.trim();
  if (trimmed.length < 2) return { valid: false, message: 'Username troppo corto (min 2 caratteri)' };
  if (trimmed.length > 30) return { valid: false, message: 'Username troppo lungo (max 30 caratteri)' };
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return { valid: false, message: 'Username puo contenere solo lettere, numeri, _, . e -' };
  }
  return { valid: true, message: '' };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export function maskUserId(id: string): string {
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
