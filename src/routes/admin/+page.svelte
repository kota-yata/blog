<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  
  export let data: PageData;
  
  let showCreateForm = false;
</script>

<svelte:head>
  <title>Admin Dashboard - Blog Console</title>
</svelte:head>

<div class="admin-container">
  <header class="admin-header">
    <h1>Blog Administration Console</h1>
    <div class="user-info">
      <span>Welcome, {data.username}</span>
      <form method="POST" action="/admin/logout" use:enhance>
        <button type="submit" class="logout-btn">Logout</button>
      </form>
    </div>
  </header>
  
  <div class="admin-content">
    <div class="actions">
      <button 
        on:click={() => showCreateForm = !showCreateForm}
        class="primary-btn"
      >
        {showCreateForm ? 'Cancel' : 'Create New Post'}
      </button>
    </div>
    
    {#if showCreateForm}
      <div class="create-form">
        <h2>Create New Post</h2>
        <form method="POST" action="/admin/posts" use:enhance>
          <div class="form-row">
            <div class="form-group">
              <label for="title">Title:</label>
              <input type="text" id="title" name="title" required />
            </div>
            <div class="form-group">
              <label for="category">Category:</label>
              <input type="text" id="category" name="category" required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="date">Date:</label>
              <input type="date" id="date" name="date" required />
            </div>
            <div class="form-group">
              <label for="lang">Language:</label>
              <select id="lang" name="lang">
                <option value="ja">Japanese</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">Description:</label>
            <textarea id="description" name="description" rows="3" required></textarea>
          </div>
          
          <div class="form-group">
            <label for="content">Content (Markdown):</label>
            <textarea id="content" name="content" rows="20" required placeholder="Write your post content in Markdown..."></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="primary-btn">Create Post</button>
            <button type="button" on:click={() => showCreateForm = false} class="secondary-btn">Cancel</button>
          </div>
        </form>
      </div>
    {/if}
    
    <div class="posts-section">
      <h2>Existing Posts</h2>
      
      <div class="posts-list">
        <h3>Japanese Posts ({data.posts.length})</h3>
        {#each data.posts as post}
          <div class="post-item">
            <div class="post-info">
              <h4>{post.meta.title}</h4>
              <p>{post.meta.description}</p>
              <div class="post-meta">
                <span>Category: {post.meta.category}</span>
                <span>Date: {post.meta.date}</span>
              </div>
            </div>
            <div class="post-actions">
              <a href="/admin/posts/{post.path}/edit" class="edit-btn">Edit</a>
              <button class="delete-btn" data-path={post.path} data-lang="ja">Delete</button>
            </div>
          </div>
        {/each}
        
        {#if data.posts.length === 0}
          <p class="no-posts">No Japanese posts found.</p>
        {/if}
      </div>
      
      <div class="posts-list">
        <h3>English Posts ({data.postsEn.length})</h3>
        {#each data.postsEn as post}
          <div class="post-item">
            <div class="post-info">
              <h4>{post.meta.title}</h4>
              <p>{post.meta.description}</p>
              <div class="post-meta">
                <span>Category: {post.meta.category}</span>
                <span>Date: {post.meta.date}</span>
              </div>
            </div>
            <div class="post-actions">
              <a href="/admin/posts/{post.path}/edit" class="edit-btn">Edit</a>
              <button class="delete-btn" data-path={post.path} data-lang="en">Delete</button>
            </div>
          </div>
        {/each}
        
        {#if data.postsEn.length === 0}
          <p class="no-posts">No English posts found.</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .admin-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
    
    h1 {
      margin: 0;
      color: #333;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      span {
        color: #666;
      }
      
      .logout-btn {
        padding: 0.5rem 1rem;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
          background-color: #c82333;
        }
      }
    }
  }
  
  .actions {
    margin-bottom: 2rem;
  }
  
  .primary-btn {
    padding: 0.75rem 1.5rem;
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    
    &:hover {
      background-color: #005c99;
    }
  }
  
  .secondary-btn {
    padding: 0.75rem 1.5rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    
    &:hover {
      background-color: #5a6268;
    }
  }
  
  .create-form {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    
    h2 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }
      
      input, textarea, select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }
      }
      
      textarea {
        resize: vertical;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
    }
    
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
  }
  
  .posts-section {
    h2 {
      color: #333;
      margin-bottom: 1.5rem;
    }
    
    .posts-list {
      margin-bottom: 2rem;
      
      h3 {
        color: #555;
        margin-bottom: 1rem;
      }
      
      .post-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 0.5rem;
        
        .post-info {
          flex: 1;
          
          h4 {
            margin: 0 0 0.5rem 0;
            color: #333;
          }
          
          p {
            margin: 0 0 0.5rem 0;
            color: #666;
          }
          
          .post-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
            color: #999;
          }
        }
        
        .post-actions {
          display: flex;
          gap: 0.5rem;
          
          .edit-btn {
            padding: 0.5rem 1rem;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9rem;
            
            &:hover {
              background-color: #218838;
            }
          }
          
          .delete-btn {
            padding: 0.5rem 1rem;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            
            &:hover {
              background-color: #c82333;
            }
          }
        }
      }
      
      .no-posts {
        color: #999;
        font-style: italic;
      }
    }
  }
</style>