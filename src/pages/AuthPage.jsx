import React, { useState, useEffect } from 'react';
import { supabase, signInWithGoogle } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AuthPage() {
  useDocumentTitle('Login / Sign Up - ExtensioVitae');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  // Check if already signed in AND listen for OAuth callback
  useEffect(() => {
    if (!supabase) return;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Listen for auth state changes (important for OAuth callback!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in (via OAuth or email)
        navigate('/dashboard');
      }
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError('Supabase is not configured. Auth is disabled.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the confirmation link!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    logger.debug('[DEBUG] Google login clicked');
    setGoogleLoading(true);
    setError(null);

    try {
      logger.debug('[DEBUG] Calling signInWithGoogle...');
      const { error } = await signInWithGoogle();
      logger.debug('[DEBUG] signInWithGoogle result:', { error });

      if (error) {
        console.error('[DEBUG] OAuth error:', error);
        setError(error.message);
        setGoogleLoading(false);
      } else {
        logger.debug('[DEBUG] OAuth initiated successfully');
      }
      // If successful, the page will redirect to Google OAuth
    } catch (err) {
      console.error('[DEBUG] Exception in Google login:', err);
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  // Skip login button for development
  const handleSkipLogin = () => {
    // Set a mock session flag for localStorage mode
    localStorage.setItem('mock_session', 'true');
    navigate('/intake');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Extensio<span className="text-amber-400">Vitae</span>
          </h1>
          <p className="text-slate-400">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || !supabase}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-slate-900 font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {googleLoading ? (
            <span>Connecting...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-900 text-slate-500">or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>

        {/* Skip login for development (when Supabase not configured) */}
        {!supabase && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={handleSkipLogin}
              className="w-full text-slate-500 hover:text-slate-400 text-sm transition-colors"
            >
              Continue without login (Development mode)
            </button>
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="mt-6 text-slate-500 text-sm text-center max-w-md">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>

      {/* Back to Home */}
      <a
        href="/"
        className="mt-8 text-slate-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Home
      </a>
    </div>
  );
}
