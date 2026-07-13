# z_connect

A frontend for the ZConnect platform — handles auth, member management, and content. Built during my internship.

---

## What is this

ZConnect is basically an internal platform for managing org members, content and media. This repo is the frontend part — it talks to a NestJS backend through API routes so the backend never gets exposed directly to the browser.

---

## Tech used

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Axios for API calls
- Zod for form validation
- React Context for auth state (no Redux, didn't need it)

---

## Why local database

So originally the plan was to connect to the actual live backend domain but the network we were working on kept blocking outgoing requests to that domain — firewall stuff, couldn't get it whitelisted in time. So i switched to running the backend locally on `localhost:3000` and it worked fine after that. The frontend just points to that through the `.env.local` file.

If youre setting this up, just make sure the backend is running locally first then update `BACKEND_API_URL` in `.env.local` to wherever your backend actually is.

---

## API testing

All the backend endpoints were tested using Postman before hooking them up to the frontend. Things like login, signup, forgot password, OTP verification — all confirmed working in Postman first. Made it way easier to know if a bug was on the frontend or backend side.

---

## Setup

1. Clone the repo
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root:
   ```
   BACKEND_API_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=
   ```
4. Make sure the backend server is running on port 3000
5. Start the dev server
   ```bash
   npm run dev -- --port 3001
   ```
6. Open `http://localhost:3001`

---

## Auth flow

- Login / Signup
- Email verification
- Forgot password → OTP → Reset password
- Google and Apple social login (token-based)
- Session handled via access token in localStorage

---

## Notes

- The `.env.local` file is gitignored so you'll need to create your own
- `NEXT_PUBLIC_API_URL` is intentionally left empty so API calls use relative paths — this avoids CORS issues when accessing from different IPs on the same network
- Social login buttons are wired up but need real Google/Apple client tokens to actually work

---

## Folder structure

```
app/
  (auth)/         → login, signup, forgot-password, etc.
  api/auth/       → BFF route handlers (proxy to backend)
  dashboard/      → protected pages
components/
  ui/             → Input, Button, SocialButton etc.
  auth/           → AuthCard, AuthLayout
lib/
  axios.ts        → axios instance with interceptors
  auth-context.tsx → global auth state
services/
  auth.service.ts → all auth API calls
schemas/          → Zod validation schemas
types/            → TypeScript types
```
