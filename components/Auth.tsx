import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Mail, Lock, AlertCircle, Loader, User, Key } from 'lucide-react';
import Card from './shared/Card';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { signIn, signUp, resendVerificationEmail, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate signup fields
        if (!firstName.trim()) {
          setError('First name is required.');
          setLoading(false);
          return;
        }
        if (!lastName.trim()) {
          setError('Last name is required.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        await signUp(email, password, firstName, lastName);
        setMessage('🎉 Welcome to IntelliBudget! We\'ve sent a magic verification link to your email. Check your inbox (and that sneaky spam folder) - click the link to unlock your budget superpowers! ✨');
        setPendingEmail(email); // Save email for resend option
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setIsSignUp(false); // Switch to login mode
      } else {
        await signIn(email, password);
        // Navigation will happen automatically via AuthContext
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Provide more helpful error messages
      if (err.message?.includes('Email rate limit')) {
        setError('Too many signup attempts. Please wait a few minutes and try again.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('🔒 Almost there! Please check your email and click that verification link to unlock your account. (Don\'t forget to check spam - it likes to hide there!)');
      } else if (err.message?.includes('already registered')) {
        setError('This email is already registered. Try signing in instead.');
      } else if (err.message?.includes('Password')) {
        setError('Password must be at least 6 characters long.');
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Network error: Unable to connect to Supabase. Please check your internet connection and verify your Supabase configuration in the browser console (F12).');
      } else if (err.message?.includes('Network error')) {
        setError('Network error: Check your internet connection and Supabase URL. Make sure .env.local is configured correctly and the dev server was restarted.');
      } else {
        setError(err.message || 'An error occurred. Please try again. Check the browser console (F12) for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <Wallet className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">IntelliBudget</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-300">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2 text-green-700 dark:text-green-300">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm flex-1">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <User size={16} />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <User size={16} />
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 6 characters
              </p>
            )}
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Key size={14} />
                Forgot Password?
              </button>
            )}
          </div>

          {showForgotPassword && !isSignUp && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!resetEmail) {
                      setError('Please enter your email address.');
                      return;
                    }
                    try {
                      setLoading(true);
                      setError(null);
                      await resetPassword(resetEmail);
                      setMessage('📧 Password reset link sent! Check your email (including spam folder) to reset your password.');
                      setShowForgotPassword(false);
                      setResetEmail('');
                    } catch (err: any) {
                      setError(err.message || 'Failed to send reset email. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader className="animate-spin" size={16} /> : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Lock size={16} />
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {pendingEmail && !isSignUp && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Didn't receive the email?
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError(null);
                  await resendVerificationEmail(pendingEmail);
                  setMessage('📧 Magic email sent again! Check your inbox (and spam folder) - we promise it\'s not hiding! 🕵️');
                } catch (err: any) {
                  setError(err.message || 'Failed to resend email. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Resend verification email
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
              setPendingEmail(null);
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
