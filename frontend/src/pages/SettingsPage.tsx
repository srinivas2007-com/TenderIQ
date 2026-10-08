import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  AlertTriangle,
  UserCheck,
  Building2,
  Lock,
  X
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.deleteAccount({
        password: deletePassword || undefined,
        confirm_text: deleteConfirmText,
      });

      toast.success('Your account and all associated data have been permanently deleted.');
      setShowDeleteModal(false);
      logout();
      navigate('/login');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please check your password.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs">Loading system configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account & System Settings</h2>
        <p className="text-xs text-slate-500">Manage your profile, AI intelligence providers, and account preferences</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">User & Company Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Full Name</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{user?.full_name || 'Enterprise User'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Email Address</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block truncate">{user?.email}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Registered Company</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block truncate">{user?.company_name || 'Not Configured'}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => navigate('/company-profile')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Edit Company Profile & Credentials →
          </button>
        </div>
      </div>

      {/* AI Provider Config */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Key className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">AI Engine Configuration</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          TenderIQ AI is connected directly to Google Gemini AI Studio to extract clauses, evaluate financial requirements, check compliance checklists, and summarize risk items.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-xs text-slate-900 block">Google Gemini AI Studio</span>
              <span className="text-[11px] text-slate-500 block">Primary AI intelligence engine active</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
            </span>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-xs text-slate-900 block">Indian Tender NLP Engine</span>
              <span className="text-[11px] text-slate-500 block">Clause extraction & rule verifier</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-slate-200 text-slate-700">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Security & Data Privacy Policy */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Security & Isolation Guarantees</h3>
        </div>

        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
          <li>Row-Level Security (RLS) ensures your uploaded tenders and company balance sheets are never visible to any other entity.</li>
          <li>All uploaded files are stored in isolated tenant paths.</li>
          <li>API keys are never returned to client responses or logged in telemetry.</li>
        </ul>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-rose-50/40 border border-rose-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-200">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-rose-900">Danger Zone</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h4 className="text-xs font-bold text-slate-900">Delete Account & Erase All Company Data</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Permanently remove your account, registered company credentials, uploaded tender PDFs, AI requirement breakdowns, cost estimates, and simulations. This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setDeletePassword('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-sm transition-colors shrink-0 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-full text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-rose-950">Confirm Permanent Account Deletion</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Are you absolutely sure? This action is immediate and cannot be reversed.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeleteAccount} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">The following data will be permanently wiped:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Your user account ({user?.email})</li>
                  <li>Company profile ({user?.company_name || 'Company Profile'})</li>
                  <li>All uploaded tender PDFs & extracted analysis</li>
                  <li>Cost breakdowns, profit scenarios & workspace tasks</li>
                </ul>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Enter your password to authorize deletion:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Your account password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  To confirm, type <span className="font-mono font-bold text-rose-600">DELETE</span> below:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Permanently Delete My Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
