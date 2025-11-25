'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get values directly from form to avoid state timing issues
    const formData = new FormData(e.target as HTMLFormElement);
    const emailValue = formData.get('email') as string;
    const nameValue = formData.get('name') as string;

    if (!emailValue || !emailValue.trim()) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', emailValue.trim());
      await login(emailValue.trim(), nameValue?.trim() || undefined);
      console.log('Login successful, redirecting...');
      // Give a moment for state to update before redirecting
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err) {
      console.error('Login error details:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px',
        padding: '32px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Welcome to LearnAI OS
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Sign in to continue to your courses
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="email" 
              style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="name" 
              style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}
            >
              Name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
              }}
              placeholder="Your name"
            />
          </div>

          {error && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '16px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: loading ? '#9ca3af' : '#4f46e5',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          Demo: Use any email to sign in
        </p>
      </div>
    </div>
  );
}

