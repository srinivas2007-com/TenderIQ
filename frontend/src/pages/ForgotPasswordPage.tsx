import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
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
        <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
        <p className="mt-1 text-xs text-slate-500">Enter your email address to receive recovery instructions</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-lg shadow-sm">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">Instructions Dispatched</h3>
              <p className="text-xs text-slate-600">
                If an account exists for {email}, instructions to reset your password have been sent.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
