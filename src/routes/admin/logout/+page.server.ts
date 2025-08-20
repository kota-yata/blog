import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { destroySession } from '../../../hooks.server';

export const actions: Actions = {
  default: async ({ cookies }) => {
    const sessionId = cookies.get('session-id');
    
    if (sessionId) {
      destroySession(sessionId);
    }
    
    cookies.delete('session-id', { path: '/' });
    
    throw redirect(302, '/admin/login');
  }
};