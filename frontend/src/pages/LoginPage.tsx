import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-white font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">TenderIQ AI</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">Access your tender intelligence workspace</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-lg shadow-sm">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                placeholder="name@company.in"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-brand-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
