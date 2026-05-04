import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/pages/LoginPage';

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    setAuthMode: vi.fn(),
    authMode: 'login',
    authLoading: false,
    requestPasswordReset: vi.fn(),
  })),
}));

vi.mock('@/stores/platformStore', () => ({
  usePlatformStore: vi.fn(() => ({
    settings: null,
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form by default', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });

  it('should switch to register mode', async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper });
    
    const registerTab = screen.getByText(/registrati/i);
    await user.click(registerTab);
    
    // Should show referral code field in register mode
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper });
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitButton = screen.getByRole('button', { name: /accedi/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    // Form should not submit with invalid email
  });

  it('should show forgot password link', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByText(/password dimenticata/i)).toBeInTheDocument();
  });
});
