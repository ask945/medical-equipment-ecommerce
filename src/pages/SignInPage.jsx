import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, name);
      } else {
        result = await signIn(email, password);
      }

      if (result.success) {
        if (isSignUp) {
          setSuccessMessage(result.message || 'Signup successful. Please verify your email.');
          // Clear form and switch to login mode after a delay
          setTimeout(() => {
            setIsSignUp(false);
            setSuccessMessage('');
            setPassword(''); // clear password field
            // Keep the email field populated so they don't have to re-type it
          }, 4000);
        } else {
          navigate('/profile');
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset password.');
      setSuccessMessage('');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccessMessage('Password reset link sent! Check your email.');
      } else {
        setError(result.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-fade-in py-12">
      <div className="w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">
              Bluecare <span className="text-primary">Pharma</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {isSignUp ? 'Sign up to get started' : 'Sign in to your account to continue'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>
            )}
            {successMessage && (
              <div className="bg-green-50 text-success text-sm px-4 py-2.5 rounded-lg border border-green-100">{successMessage}</div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-text-secondary">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button variant="primary" size="lg" className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage(''); }}
                className="text-primary font-medium hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 mt-8">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Shield size={12} className="text-primary" />
            <span>Your data is protected with 256-bit encryption</span>
          </div>
          <Link
            to="/admin"
            className="text-[11px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            <Lock size={10} />
            Administrator Access
          </Link>
        </div>
      </div>
    </div>
  );
}
