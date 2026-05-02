import { describe, it, expect } from 'vitest';
import { mapProfileToUser, mapTeamMember, mapPortfolioEntryToUserDevice } from '@/store/mappers';
import type { ProfileRow, TeamMemberRow, PortfolioEntryRow } from '@/store/db-types';

describe('Mappers', () => {
  describe('mapProfileToUser', () => {
    it('should map profile row to user correctly', () => {
      const profile: ProfileRow = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        avatar_url: 'https://example.com/avatar.png',
        tier: 'ZYRA',
        balance: 100,
        referral_code: 'VYRO-TEST',
        referred_by: 'SYSTEM',
        streak: 5,
        last_claim: null,
        last_claim_amount: 0,
        joined_at: '2024-01-01T00:00:00Z',
        team_size: 3,
        account_blocked: false,
        claim_eligible: true,
        tier_override: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const user = mapProfileToUser(profile, 500, 150);

      expect(user.id).toBe('user-1');
      expect(user.username).toBe('testuser');
      expect(user.vx_balance).toBe(100);
      expect(user.compute_power).toBe(500);
      expect(user.demo_usdt_balance).toBe(150);
      expect(user.invite_code).toBe('VYRO-TEST');
      expect(user.role).toBe('user');
      expect(user.tier).toBe('ZYRA');
      expect(user.streak).toBe(5);
      expect(user.account_blocked).toBe(false);
    });

    it('should handle admin role', () => {
      const profile = { id: 'admin-1', role: 'admin', referral_code: 'VYRO-ADMIN' } as ProfileRow;
      const user = mapProfileToUser(profile, 0, 0);
      expect(user.role).toBe('admin');
    });
  });

  describe('mapTeamMember', () => {
    it('should map team member row correctly', () => {
      const row: TeamMemberRow = {
        id: 'tm-1',
        owner_id: 'owner-1',
        member_user_id: 'member-1',
        username: 'teammate',
        avatar_url: null,
        tier: 'ZYRA',
        joined: '2024-01-15T00:00:00Z',
        contribution: 50,
        active_balance: 100,
        active_sub_count: 2,
        account_blocked: false,
        claim_eligible: true,
        is_test_bot: false,
        expires_at: null,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        level: 1,
      };

      const member = mapTeamMember(row);

      expect(member.id).toBe('tm-1');
      expect(member.username).toBe('teammate');
      expect(member.level).toBe(1);
      expect(member.production).toBe(50);
      expect(member.status).toBe('active');
      expect(member.device_active).toBe(true);
    });
  });

  describe('mapPortfolioEntryToUserDevice', () => {
    it('should map portfolio entry to user device', () => {
      const entry: PortfolioEntryRow = {
        id: 'pe-1',
        owner_id: 'owner-1',
        name: 'RTX 4090',
        allocation: 4200,
        value: 72000,
        change: 100,
        cycle_reward: 18666,
        cycle_days: 7,
        last_cycle_reset_at: '2024-01-01T00:00:00Z',
        position: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const device = mapPortfolioEntryToUserDevice(entry);

      expect(device.id).toBe('pe-1');
      expect(device.status).toBe('active');
      expect(device.total_generated).toBeGreaterThanOrEqual(0);
      expect(device.device?.name).toBe('RTX 4090');
      expect(device.device?.compute_power).toBe(4200);
    });
  });
});
