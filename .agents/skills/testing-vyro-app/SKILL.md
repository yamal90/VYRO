---
name: testing-vyro-app
description: Test the VYRO GPU cloud computing app end-to-end. Use when verifying Supabase integration, Settings page, or other UI changes.
---

# Testing VYRO App

## Prerequisites

- Node.js and npm installed
- Access to the Supabase instance (anon key is hardcoded in `src/lib/supabase.ts`)

## Devin Secrets Needed

- None required for basic testing. The Supabase anon key is hardcoded in the codebase.
- For admin operations, a `SUPABASE_SERVICE_ROLE_KEY` would be needed but is not currently available.

## Dev Server Setup

```bash
cd /home/ubuntu/VYRO
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

- If port 5173 is occupied, Vite will auto-assign the next available port (e.g., 5174).
- Verify with: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`
- Kill stale processes if needed: `fuser -k 5173/tcp`

## Creating a Test User

The Supabase instance has `mailer_autoconfirm=false`, so email confirmation is required.

1. **Sign up via API**:
```bash
curl -s https://xdrokyklrmfiwrfwgtgc.supabase.co/auth/v1/signup \
  -H "apikey: <ANON_KEY_FROM_src/lib/supabase.ts>" \
  -H "Content-Type: application/json" \
  -d '{"email":"devin-test-vyro@mailinator.com","password":"TestVYRO123!","data":{"username":"devintest"}}'
```

2. **Confirm email via Mailinator**:
```bash
# Fetch inbox
curl -s "https://www.mailinator.com/api/v2/domains/public/inboxes/devin-test-vyro"
# Get message body (use message ID from inbox response)
curl -s "https://www.mailinator.com/api/v2/domains/public/inboxes/devin-test-vyro/messages/<MSG_ID>"
# Extract confirmation URL from HTML body and hit it
curl -sL "<CONFIRMATION_URL>"
```

3. **Login**: Use the email/password in the app's login form or via API:
```bash
curl -s https://xdrokyklrmfiwrfwgtgc.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"devin-test-vyro@mailinator.com","password":"TestVYRO123!"}'
```

## Key Testing Tips

- **Mailinator** is a free disposable email service. Use `<anything>@mailinator.com` for test accounts and fetch emails via their public API.
- If you get `email_not_confirmed` error on login, the user's email hasn't been confirmed yet. Check Mailinator for the confirmation email.
- The app uses **AppContext** (`src/store/AppContext.tsx`) for auth state. After login via Supabase, it fetches the user profile from the `profiles` table.
- If the DB schema hasn't been deployed, profile queries will fail and the app might show a loading spinner indefinitely after login.
- The app is designed as **mobile-first** but works in desktop browser. The bottom nav has: Home, GPU, Benefici, FAQ, Transazioni, Team, Impo(stazioni).

## Settings Page Testing

The Settings page (`src/pages/SettingsPage.tsx`) requires authentication. It returns `null` if `!currentUser`.

### Features to Test

1. **Profile Card**: Shows avatar, username, email, member-since date. Edit icon opens NicknameModal.
2. **Toggle Persistence**: Theme, Notifications, Haptic toggles persist via `localStorage` key `vyro_settings`. Toggle → navigate away → return → verify toggle state preserved.
3. **Nickname Modal**: Click pencil icon → modal opens with current name pre-filled.
4. **Avatar Modal**: Click avatar → modal opens with file upload.
5. **Password Reset**: Click "Cambia password" → sends reset email → description changes to "Email inviata". Note: `resetEmailSent` state is component-level (`useState`), so it resets on navigation.
6. **FAQ Navigation**: Click FAQ row → navigates to `/faq`.
7. **2FA Badge**: Shows "Prossimamente" description and "Soon" badge (no chevron).
8. **Logout**: Click "Esci dall'account" → confirmation dialog → Cancel keeps user in, Esci logs out to login page.

## Browser Navigation Tips

- Chrome CDP is available at `http://localhost:29229`
- If the browser seems stuck on Google new tab, try clicking the address bar and typing the URL manually
- Playwright CDP connection might time out due to version mismatches — use the computer tool for UI interaction instead
- When multiple Vite processes are running, kill all with `pkill -f vite` and restart

## Lint & Build

```bash
npm run lint
npm run build
```

Both must pass before creating PRs.
