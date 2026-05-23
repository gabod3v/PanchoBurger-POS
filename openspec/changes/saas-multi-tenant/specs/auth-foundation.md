# Phase 1 — Auth Foundation

## Requirements

1. Users sign up with email/password, automatically creating:
   - Tenant (inquilino) → trial subscription
   - Profile (perfil) as `owner`
   - Default location (ubicacion)

2. Users sign in and get redirected to the dashboard
   - Auth state persisted via Supabase session
   - Profile + Tenant + Subscription loaded on init

3. Unauthenticated users are redirected to `/login`
   - Public routes: `/login`, `/register`
   - All other routes protected via `<ProtectedRoute>`
   - Kitchen display (`/cocina`) also protected

4. Register form includes: full name, restaurant name, email, password, confirm password

## Scenarios

### Sign Up
- User fills register form → `signUp()` → Supabase Auth user created → DB trigger creates tenant + profile + subscription + location → confirmation email sent ✅
- User clicks email link → session starts → `AuthProvider` loads profile + tenant → redirected to `/`

### Sign In
- User enters email/password → `signIn()` → session stored → `AuthProvider` loads profile + tenant + subscription → redirected to `/`
- Wrong credentials → error message "Email o contraseña incorrectos"

### Protected Route
- Not authenticated → redirected to `/login` with no flash
- Loading auth state → spinner shown
- Authenticated → renders children

### Session Persistence
- Page refresh → `getSession()` recovers session → user data loaded
- Session expired → redirect to login
- `onAuthStateChange` handles SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT
