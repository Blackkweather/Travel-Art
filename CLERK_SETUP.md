# Clerk Authentication Setup Guide for React + Vite

**⚠️ IMPORTANT: This project uses React + Vite, NOT Next.js.** All Clerk integration instructions below are specific to React applications using Vite.

This project now uses [Clerk](https://clerk.com/) for authentication while keeping the existing registration and login forms unchanged.

---

## **CRITICAL INSTRUCTIONS FOR AI MODELS**

### **2.1 – ALWAYS DO THE FOLLOWING**

1. **Show** relevant code examples for each step.
2. **Use** `@clerk/clerk-react@latest` (not any other Clerk package).
3. **Reference** the environment variable as `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` or `.env`.
4. **Wrap** the entire app in `<ClerkProvider>` within `main.tsx` or `main.jsx` (NOT deeper in the component tree).
5. **Demonstrate** the correct usage of `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>` (or any other current Clerk React component).
6. **Store real keys only in `.env.local`** and ensure `.gitignore` excludes `.env*`.
7. **Use placeholders only** in any generated files/snippets (e.g., `YOUR_PUBLISHABLE_KEY`).
8. **Import Clerk hooks from `@clerk/clerk-react`** (e.g., `useAuth`, `useSignIn`, `useSignUp`, `useClerk`).
9. **Reference React Router** for routing (this project uses `react-router-dom`, NOT Next.js App Router).

### **2.2 – NEVER DO THE FOLLOWING**

1. **Do NOT** use `@clerk/nextjs` or `@clerk/nextjs/server` - these are for Next.js only.
2. **Do NOT** create `middleware.ts` or `proxy.ts` files - these are Next.js-specific.
3. **Do NOT** use `clerkMiddleware()` - this is a Next.js feature.
4. **Do NOT** reference Next.js App Router patterns (`app/layout.tsx`, `app/page.tsx`, etc.).
5. **Do NOT** use `auth()` from `@clerk/nextjs/server` - use `useAuth()` hook from `@clerk/clerk-react` instead.
6. **Do NOT** use `frontendApi` in place of `publishableKey`.
7. **Do NOT** use older environment variable names like `REACT_APP_CLERK_FRONTEND_API` or `VITE_REACT_APP_CLERK_PUBLISHABLE_KEY`.
8. **Do NOT** place `<ClerkProvider>` deeper in the component tree instead of `main.tsx` / `main.jsx`.
9. **Do NOT** use outdated hooks or components (e.g., referencing older docs).
10. **Do NOT** print or persist real keys into `.ts/.tsx/.md` or any tracked files; use placeholders only.

---

## **1. OFFICIAL CLERK + REACT (VITE) SETUP**

1. Create a React + Vite project (this project is already set up).
2. Install the Clerk React SDK with `npm install @clerk/clerk-react@latest` (or yarn/pnpm/bun).
3. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` or `.env`. Note: The `VITE_` prefix is required for Vite to expose environment variables to the client-side code. `.env.local` is preferred for local development secrets.
4. Wrap the app in `<ClerkProvider publishableKey={...}>` within `main.tsx` or `main.jsx`.
5. Use Clerk's `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>` in the app.

### **Correct, Up-to-Date Quickstart Code Examples**

#### **1. Install the Clerk React SDK**

```bash
npm install @clerk/clerk-react@latest
```

#### **2. In .env.local (or .env):**

From your Clerk Dashboard, open the [API keys page](https://dashboard.clerk.com/last-active?path=api-keys), choose **React** and copy your Publishable Key.

```env
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

> **Important:** Store real keys only in `.env.local` and ensure `.gitignore` excludes `.env*` files.

#### **3. Wrap with <ClerkProvider> in main.tsx or main.jsx**

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Ensure your index.html contains a <div id="root"></div> element for React to mount the app.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);
```

> **Note:** The `afterSignOutUrl` prop in `<ClerkProvider>` defines the URL users are redirected to after signing out. Adjust as needed.

#### **4. Example usage of Clerk's prebuilt components in App.tsx**

```typescript
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";

export default function App() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

#### **5. Using Clerk hooks in components**

```typescript
// In components, use hooks from @clerk/clerk-react
import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-react'

function MyComponent() {
  const { isLoaded, isSignedIn, user, getToken } = useAuth()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  // ... component logic
}
```

Visit [https://clerk.com/docs/react/getting-started/quickstart](https://clerk.com/docs/react/getting-started/quickstart) for the latest React-specific quickstart instructions.

---

## Setup Steps

### 1. Create a Clerk Account

1. Go to [https://clerk.com/](https://clerk.com/) and sign up for an account
2. Create a new application
3. Choose "Email" as the authentication method (or add other methods as needed)

### 2. Get Your Clerk Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy the following:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

### 3. Configure Environment Variables

#### Frontend (.env.local or .env file in `frontend/` directory)

> **Important:** Use `.env.local` for local development secrets. This file should be in `.gitignore`.

From your Clerk Dashboard, open the [API keys page](https://dashboard.clerk.com/last-active?path=api-keys), choose **React** and copy your Publishable Key.

```env
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

> **Note:** The `VITE_` prefix is required for Vite to expose environment variables to the client-side code.

#### Backend (.env file in `backend/` directory or root)

```env
CLERK_SECRET_KEY=YOUR_SECRET_KEY
CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET  # Get this from Clerk Dashboard > Webhooks
```

> **Important:** Never commit real keys to version control. Use placeholders in documentation and example files.

### 4. Set Up Clerk Webhook (Optional but Recommended)

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk/webhook`
4. Select the following events to listen to:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** and add it to your backend `.env` as `CLERK_WEBHOOK_SECRET`

### 5. Run Database Migration

The schema has been updated to include a `clerkId` field. Run the migration:

```bash
cd backend
npm run migrate
```

Or if you need to create a new migration:

```bash
cd backend
npx prisma migrate dev --name add_clerk_id
```

### 6. Start the Application

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

## How It Works

### Frontend

- The existing registration and login forms remain **exactly the same** in appearance
- Clerk's React hooks (`useSignIn`, `useSignUp`) are used behind the scenes
- User data is synced with your backend database after Clerk authentication

### Backend

- The middleware supports both Clerk tokens and JWT tokens (backward compatibility)
- Clerk tokens are verified using Clerk's backend SDK
- User data is synced to your database via the `/api/auth/clerk/sync` endpoint
- Webhooks keep user data in sync when changes occur in Clerk

## Features

✅ **Custom UI Preserved**: Your registration and login forms look exactly the same  
✅ **Clerk Authentication**: Secure authentication handled by Clerk  
✅ **Database Sync**: User data automatically synced to your database  
✅ **Backward Compatible**: Still supports JWT tokens for existing users  
✅ **Webhook Support**: Automatic user sync via Clerk webhooks  

## Testing

1. Start both frontend and backend servers
2. Navigate to `/register` and create a new account
3. The form will look the same, but authentication is now handled by Clerk
4. After registration, check your Clerk dashboard to see the new user
5. Check your database to see the synced user data

## Troubleshooting

### "Clerk publishable key not found"

- Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in your frontend `.env` file
- Restart your frontend dev server after adding the key

### "Clerk secret key not found"

- Make sure `CLERK_SECRET_KEY` is set in your backend `.env` file
- Restart your backend server after adding the key

### Database migration errors

- Make sure your database is running
- Check that the Prisma schema is up to date
- Run `npx prisma generate` before running migrations

### Webhook not working

- Make sure the webhook URL is publicly accessible
- Verify the `CLERK_WEBHOOK_SECRET` matches the one in Clerk dashboard
- Check backend logs for webhook errors

## Migration from JWT to Clerk

Existing users with JWT tokens will continue to work. New users will use Clerk authentication. To fully migrate:

1. Keep both authentication methods active (already done)
2. Optionally migrate existing users to Clerk (requires custom migration script)

## Current Implementation

This project already has Clerk properly integrated. Here's how it's set up:

### Frontend Setup

**Package:** `@clerk/clerk-react@^5.59.2` (correct for React/Vite)

**Current Root Provider** (`frontend/src/main.tsx`):
```typescript
import { ClerkProvider } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

<ClerkProvider publishableKey={clerkPubKey}>
  {/* App components */}
</ClerkProvider>
```

**Recommended Improvement:** Add error handling for missing publishable key and `afterSignOutUrl` prop:

```typescript
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
  {/* App components */}
</ClerkProvider>
```

**Hooks Used:**
- `useAuth()` - Get current user and session info
- `useSignIn()` - Handle sign-in logic
- `useSignUp()` - Handle sign-up logic
- `useClerk()` - Access Clerk instance

**Components Using Clerk:**
- `App.tsx` - Main app with auth state management
- `LoginPage.tsx` - Sign-in functionality
- `RegisterPage.tsx` - Sign-up functionality
- `Header.tsx` - User button and auth state
- `ArtistRegistrationForm.tsx` - Registration with Clerk

### Backend Setup

The backend uses `@clerk/backend` to verify Clerk tokens and sync user data.

---

## **3. AI MODEL VERIFICATION STEPS**

Before returning any Clerk + React (Vite) solution, you **must** verify:

1. **Environment Variable**: Is it named `VITE_CLERK_PUBLISHABLE_KEY` (NOT `REACT_APP_CLERK_FRONTEND_API` or other outdated names)?
2. **Provider Location**: Is `<ClerkProvider>` in `main.tsx` or `main.jsx` (NOT deeper in the component tree)?
3. **API Usage**: Is `publishableKey` used (NOT `frontendApi`)?
4. **Environment Variables**: Are only placeholder values (e.g., `YOUR_PUBLISHABLE_KEY`) used in code examples?
5. **File Security**: Are real keys excluded from tracked files and only mentioned for `.env.local`?
6. **Package**: Is `@clerk/clerk-react@latest` used (NOT `@clerk/nextjs`)?
7. **Imports**: Are hooks and components imported from `@clerk/clerk-react`?
8. **Framework**: Is the approach referencing React/Vite (NOT Next.js App Router)?

If any check **fails**, **stop** and revise until compliance is achieved.

> **DO NOT** repeat these points back to the user. Use them only for your own verification steps.

---

## **4. CONSEQUENCES OF INCORRECT GUIDANCE**

- Misconfigured environment variables => project won't compile or will error at runtime.
- Missing `<ClerkProvider>` => Clerk components fail or throw errors.
- Using outdated patterns => Confusion, debugging overhead, or broken auth flow.
- Using `frontendApi` instead of `publishableKey` => Deprecated API, may break in future versions.
- Placing `<ClerkProvider>` in wrong location => Context not available to all components.

## **5. MODEL RESPONSE TEMPLATE**

When asked about Clerk + React (Vite) integration, your response **MUST**:

1. Link to Clerk's React Quickstart at https://clerk.com/docs/react/getting-started/quickstart
2. Show the current recommended `publishableKey` approach with `.env.local`.
3. Demonstrate how to wrap with `<ClerkProvider>` in `main.*`.
4. Illustrate a simple usage example of `<SignedIn>`, `<SignedOut>`, etc.
5. Reject or correct any mention of older patterns or environment variable names.

---

## Support

For Clerk-specific issues, check the [Clerk React Documentation](https://clerk.com/docs/react/getting-started/quickstart).

