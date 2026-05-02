import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DevicesPage from '@/pages/DevicesPage';

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    currentUser: {
      id: 'user-1',
      username: 'testuser',
      vx_balance: 500,
      demo_usdt_balance: 100,
      role: 'user',
    },
    isLoggedIn: true,
  })),
}));

vi.mock('@/stores/devicesStore', () => ({
  useDevicesStore: vi.fn(() => ({
    gpuDevices: [
      {
        id: 'gpu-1',
        name: 'RTX 4090',
        description: 'AMD Ryzen 9 7950X3D | 64GB RAM',
        price: 72000,
        reward_3_days: 7600,
        reward_7_days: 18666,
        compute_power: 4200,
        active: true,
        image_url: '/images/gpu-ix9900.jpg',
      },
    ],
    userDevices: [],
    activateDevice: vi.fn(),
    isLoading: false,
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('DevicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render GPU center tab by default', () => {
    render(<DevicesPage />, { wrapper });
    expect(screen.getByText('Centro GPU')).toBeInTheDocument();
  });

  it('should show GPU devices', () => {
    render(<DevicesPage />, { wrapper });
    expect(screen.getByText('RTX 4090')).toBeInTheDocument();
    expect(screen.getByText('72000')).toBeInTheDocument();
  });

  it('should switch to my devices tab', async () => {
    const user = userEvent.setup();
    render(<DevicesPage />, { wrapper });
    
    const myDevicesTab = screen.getByText('I Miei Dispositivi');
    await user.click(myDevicesTab);
    
    expect(screen.getByText('Nessun dispositivo attivato')).toBeInTheDocument();
  });

  it('should show activate button for GPUs', () => {
    render(<DevicesPage />, { wrapper });
    expect(screen.getByText('Attiva GPU')).toBeInTheDocument();
  });

  it('should show insufficient balance warning', async () => {
    vi.mock('@/stores/authStore', () => ({
      useAuthStore: vi.fn(() => ({
        currentUser: {
          id: 'user-1',
          username: 'testuser',
          vx_balance: 100, // Less than GPU price
          demo_usdt_balance: 0,
          role: 'user',
        },
        isLoggedIn: true,
      })),
    }));

    render(<DevicesPage />, { wrapper });
    expect(screen.getByText('Saldo Dollaro insufficiente')).toBeInTheDocument();
  });
});
