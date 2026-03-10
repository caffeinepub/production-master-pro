# Production Master Pro

## Current State
The app uses a username/password login (default A/a) stored in localStorage. The AppHeader has a settings dialog to change credentials. All data is stored globally in Motoko stable storage (not per-user). `@dfinity/auth-client` ~3.3.0 is already in package.json.

## Requested Changes (Diff)

### Add
- Internet Identity login screen replacing the username/password screen
- `useAuth` hook managing AuthClient state (login, logout, identity, principal)
- Profile indicator in AppHeader top-right showing the user is logged in (icon + short principal text or "II User")
- Logout button in the settings dialog in AppHeader

### Modify
- `LoginScreen.tsx`: Replace username/password form with a single "Login with Internet Identity" button using `@dfinity/auth-client`. On click, call `authClient.login()` with identityProvider. On success call `onLogin()`.
- `App.tsx`: Integrate AuthClient. On mount, check `authClient.isAuthenticated()`. Pass logout handler down to AppHeader.
- `AppHeader.tsx`: Accept `onLogout` prop. Show user icon + "II User" label in top-right. In settings dialog, replace credentials content with a Logout button.

### Remove
- Username/password fields and credential-change logic from LoginScreen and AppHeader
- localStorage credential storage

## Implementation Plan
1. Create `src/frontend/src/hooks/useAuth.ts` - wraps AuthClient, exposes `{ isAuthenticated, principal, login, logout, loading }`
2. Update `LoginScreen.tsx` - replace form with II login button
3. Update `AppHeader.tsx` - add `onLogout` prop, show user indicator, add logout in settings
4. Update `App.tsx` - use useAuth hook, pass handlers, keep splash screen flow
5. Validate and fix any TypeScript errors
