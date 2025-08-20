<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  let username = '';
  let password = '';
  let error = '';
  let loading = false;
</script>

<svelte:head>
  <title>Admin Login - Blog Console</title>
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <h1>Admin Console</h1>
    <p>Please log in to access the blog administration panel.</p>
    
    {#if error}
      <div class="error">{error}</div>
    {/if}
    
    <form 
      method="POST" 
      use:enhance={() => {
        loading = true;
        error = '';
        return async ({ result, update }) => {
          loading = false;
          if (result.type === 'success') {
            goto('/admin');
          } else if (result.type === 'failure') {
            error = result.data?.message || 'Login failed';
          }
          await update();
        };
      }}
    >
      <div class="form-group">
        <label for="username">Username:</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          bind:value={username}
          required 
          disabled={loading}
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password:</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          bind:value={password}
          required 
          disabled={loading}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  </div>
</div>

<style lang="scss">
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 20px;
  }
  
  .login-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    
    h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      text-align: center;
    }
    
    p {
      color: #666;
      text-align: center;
      margin-bottom: 2rem;
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
    
    input {
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
      
      &:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
    }
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover:not(:disabled) {
      background-color: #005c99;
    }
    
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }
  
  .error {
    background-color: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    text-align: center;
  }
</style>