import { type Handle, redirect } from '@sveltejs/kit';

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'blogadmin123';

interface SessionData {
  isAuthenticated: boolean;
  username?: string;
}

// Simple in-memory session store (in production, use a proper session store)
const sessions = new Map<string, SessionData>();

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('session-id');
  
  // Check if user is authenticated
  let session: SessionData = { isAuthenticated: false };
  if (sessionId && sessions.has(sessionId)) {
    session = sessions.get(sessionId)!;
  }
  
  // Add session data to locals
  event.locals.session = session;
  
  // Protect admin routes (except login)
  if (event.url.pathname.startsWith('/admin') && !event.url.pathname.startsWith('/admin/login')) {
    if (!session.isAuthenticated) {
      throw redirect(302, '/admin/login');
    }
  }
  
  return resolve(event);
};

// Helper function to create session
export function createSession(username: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    isAuthenticated: true,
    username
  });
  return sessionId;
}

// Helper function to destroy session
export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

// Helper function to validate credentials
export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}