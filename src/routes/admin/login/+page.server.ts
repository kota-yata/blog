import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { validateCredentials, createSession } from '../../../hooks.server';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString() || '';
    const password = data.get('password')?.toString() || '';
    
    if (!username || !password) {
      return fail(400, {
        message: 'Username and password are required'
      });
    }
    
    if (!validateCredentials(username, password)) {
      return fail(401, {
        message: 'Invalid username or password'
      });
    }
    
    // Create session
    const sessionId = createSession(username);
    
    // Set HTTP-only cookie
    cookies.set('session-id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    throw redirect(302, '/admin');
  }
};