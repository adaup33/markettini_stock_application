# Manual Testing Guide for Sign-Up Fix

## Issue Fixed
- **Problem**: After successful account creation and email sending, redirect to dashboard fails with mixed toast notifications
- **Root Cause**: Race condition between client-side sign-in and server-side session check
- **Solution**: Increased delay and hard navigation to ensure session propagation

## Changes Made

### File: `app/(auth)/sign-up/page.tsx`

#### Change 1: Better Error Checking
```typescript
// Before:
if (signInResult.error) {

// After:
if (signInResult?.error || !signInResult?.data) {
```
**Rationale**: Better Auth client might return errors in different formats. This checks both error field and missing data.

#### Change 2: Improved Session Propagation
```typescript
// Before:
await new Promise(resolve => setTimeout(resolve, 500));
router.refresh();
router.push('/');

// After:
await new Promise(resolve => setTimeout(resolve, 1000));
window.location.href = '/';
```
**Rationale**: 
- Increased delay from 500ms to 1000ms for better cookie propagation
- Hard navigation (`window.location.href`) ensures fresh server-side session check
- Avoids race condition with Next.js router and server-side session detection

## Manual Testing Steps

### Prerequisites
1. Ensure MongoDB is running
2. Ensure environment variables are set (BETTER_AUTH_SECRET, MONGODB_URI, etc.)
3. Start development server: `npm run dev`

### Test Case 1: Successful Sign-Up Flow
1. Navigate to `/sign-up`
2. Fill in all required fields:
   - Full Name: "Test User"
   - Email: Use a unique email (e.g., `test-{timestamp}@example.com`)
   - Password: At least 8 characters
   - Select Country, Investment Goals, Risk Tolerance, Preferred Industry
3. Click "Start Your Investing Journey"
4. **Expected Results**:
   - ✅ Toast: "Account created successfully - Signing you in..."
   - ✅ Toast: "Welcome! Redirecting to dashboard..."
   - ✅ Redirect to `/` (dashboard) after ~1 second
   - ✅ Dashboard loads successfully without redirect loop
   - ✅ No error toasts appear
   - ✅ Inngest welcome email sent (check server logs)

### Test Case 2: Duplicate Email Error
1. Navigate to `/sign-up`
2. Use an email that already exists in the database
3. Fill in other fields and submit
4. **Expected Results**:
   - ✅ Toast: "Sign up failed - An account with this email already exists..."
   - ✅ User stays on sign-up page
   - ✅ No redirect occurs
   - ✅ No welcome email sent

### Test Case 3: Invalid Form Data
1. Navigate to `/sign-up`
2. Try submitting with:
   - Empty fields
   - Invalid email format
   - Password < 8 characters
3. **Expected Results**:
   - ✅ Form validation errors display
   - ✅ Form does not submit
   - ✅ No toasts appear

### Test Case 4: Network Error During Sign-Up
1. Disconnect network or kill MongoDB
2. Try to sign up
3. **Expected Results**:
   - ✅ Toast: "Sign up failed - An unexpected error occurred"
   - ✅ User stays on sign-up page

## Verification Checklist

After testing, verify:
- [ ] No toast notification saying "failed to add" appears during successful sign-up
- [ ] Only appropriate success toasts appear in sequence
- [ ] Dashboard loads without redirect loop
- [ ] Session persists across page navigation
- [ ] Inngest email event is sent (check server logs for "app/user.created")
- [ ] User can sign out and sign in again successfully

## Notes
- The 1-second delay is necessary to ensure cookie propagation across browser/server
- Hard navigation (`window.location.href`) is intentional to force server-side session check
- The fix addresses timing issues with Better Auth's cookie-based session management
