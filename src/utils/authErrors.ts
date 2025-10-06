import { AuthError, AuthApiError } from '@supabase/supabase-js';

export type MappedAuthError = { field?: 'email' | 'password'; message: string };

function toLower(s?: string) {
  return (s || '').toLowerCase();
}

/**
 * Maps Supabase authentication errors to user-friendly messages
 * @param error - The error from Supabase Auth
 * @param context - Whether this is for 'signup' or 'signin'
 * @returns An object with optional field name and user-friendly message
 */
export function mapSupabaseAuthError(error: unknown, context: 'signup' | 'signin'): MappedAuthError {
  if (!error) return { message: 'Unexpected error.' };

  // Handle AuthApiError (REST API errors)
  if (error instanceof AuthApiError) {
    const status = error.status;
    const msg = toLower(error.message);

    // Duplicate email (signup only)
    if (
      context === 'signup' &&
      (
        status === 422 ||
        status === 409 ||
        msg.includes('already registered') ||
        msg.includes('user already exists') ||
        msg.includes('user already registered') ||
        msg.includes('email already registered') ||
        msg.includes('duplicate key')
      )
    ) {
      return {
        field: 'email',
        message: 'This email has already been registered. Please sign in instead or use a different email.',
      };
    }

    // Invalid credentials (signin only)
    if (context === 'signin' && (status === 400 || status === 401 || msg.includes('invalid login'))) {
      return {
        field: 'password',
        message: 'Incorrect email or password.',
      };
    }

    // Unconfirmed email
    if (msg.includes('email not confirmed')) {
      return { field: 'email', message: 'Please confirm your email before signing in.' };
    }

    // Rate limit
    if (status === 429) {
      return { message: 'Too many attempts. Please try again later.' };
    }

    // Invalid email format (usually caught client-side)
    if (status === 400 && msg.includes('invalid email')) {
      return { field: 'email', message: 'Please enter a valid email address.' };
    }

    // Password too weak
    if (msg.includes('password') && msg.includes('weak')) {
      return { field: 'password', message: 'Password is too weak. Please choose a stronger password.' };
    }

    // User not found (signin)
    if (context === 'signin' && (msg.includes('user not found') || msg.includes('no user found'))) {
      return {
        field: 'email',
        message: 'No account found with this email address.',
      };
    }

    return { message: error.message || 'Authentication failed.' };
  }

  // Handle generic AuthError
  if (error instanceof AuthError) {
    const msg = toLower(error.message);

    // Check for common auth error patterns
    if (context === 'signup' && (msg.includes('already registered') || msg.includes('user already exists'))) {
      return {
        field: 'email',
        message: 'This email has already been registered. Please sign in instead or use a different email.',
      };
    }

    if (context === 'signin' && msg.includes('invalid login')) {
      return {
        field: 'password',
        message: 'Incorrect email or password.',
      };
    }

    return { message: error.message || 'Authentication failed.' };
  }

  // Handle string errors or other error types
  if (typeof error === 'string') {
    const msg = toLower(error);

    if (context === 'signup' && (msg.includes('already registered') || msg.includes('user already exists'))) {
      return {
        field: 'email',
        message: 'This email has already been registered. Please sign in instead or use a different email.',
      };
    }

    if (context === 'signin' && msg.includes('invalid login')) {
      return {
        field: 'password',
        message: 'Incorrect email or password.',
      };
    }

    return { message: error };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const msg = toLower(error.message);

    if (context === 'signup' && (msg.includes('already registered') || msg.includes('user already exists'))) {
      return {
        field: 'email',
        message: 'This email has already been registered. Please sign in instead or use a different email.',
      };
    }

    if (context === 'signin' && msg.includes('invalid login')) {
      return {
        field: 'password',
        message: 'Incorrect email or password.',
      };
    }

    return { message: error.message || 'Something went wrong. Please try again.' };
  }

  return { message: 'Something went wrong. Please try again.' };
}

/**
 * Checks if an error indicates a duplicate email scenario
 * @param error - The error to check
 * @returns true if the error indicates duplicate email
 */
export function isDuplicateEmailError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : String(error);

  const msg = toLower(errorMessage);
  
  return (
    msg.includes('already registered') ||
    msg.includes('user already exists') ||
    msg.includes('user already registered') ||
    msg.includes('email already registered') ||
    msg.includes('duplicate key')
  );
}
