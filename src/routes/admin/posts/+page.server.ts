import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import fs from 'fs';
import path from 'path';

// Helper function to generate a URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50); // Limit length
}

// Helper function to format date for frontmatter
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // Check authentication
    if (!locals.session.isAuthenticated) {
      throw redirect(302, '/admin/login');
    }
    
    const data = await request.formData();
    const title = data.get('title')?.toString() || '';
    const category = data.get('category')?.toString() || '';
    const date = data.get('date')?.toString() || '';
    const description = data.get('description')?.toString() || '';
    const content = data.get('content')?.toString() || '';
    const lang = data.get('lang')?.toString() || 'ja';
    
    // Validate required fields
    if (!title || !category || !date || !description || !content) {
      return fail(400, {
        message: 'All fields are required'
      });
    }
    
    try {
      // Generate filename from title and date
      const slug = generateSlug(title);
      const formattedDate = formatDate(date);
      const filename = `${slug}.md`;
      
      // Determine directory based on language
      const postsDir = lang === 'en' 
        ? path.join(process.cwd(), 'src/contents/posts-en')
        : path.join(process.cwd(), 'src/contents/posts');
      
      // Check if file already exists
      const filepath = path.join(postsDir, filename);
      if (fs.existsSync(filepath)) {
        return fail(400, {
          message: 'A post with this title already exists'
        });
      }
      
      // Create markdown content with frontmatter
      const markdownContent = `---
title: ${title}
date: ${formattedDate}
category: ${category}
description: ${description}
---

${content}`;
      
      // Ensure directory exists
      if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(filepath, markdownContent, 'utf8');
      
      return {
        success: true,
        message: 'Post created successfully',
        filename
      };
      
    } catch (error) {
      console.error('Error creating post:', error);
      return fail(500, {
        message: 'Failed to create post'
      });
    }
  }
};