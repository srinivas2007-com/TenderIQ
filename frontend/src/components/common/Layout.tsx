import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, X, UploadCloud, Building2, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Determine current section title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Executive Dashboard & Intelligence';
    if (path.startsWith('/tenders/upload')) return 'Upload Tender Document';
    if (path.startsWith('/compare')) return 'Smart Tender Comparison Matrix';
    if (path.startsWith('/simulator')) return 'What-If Commercial & Capacity Simulator';
    if (path.startsWith('/analytics')) return 'Historical Tender Performance & Learning';
    if (path.startsWith('/tenders') && path !== '/tenders') return 'Tender Decision Workspace';
    if (path.startsWith('/tenders')) return 'Tender Intelligence Pipeline';
    if (path.startsWith('/company-profile') || path.startsWith('/profile')) return 'Company Profile & Credentials';
    if (path.startsWith('/settings')) return 'System Settings & AI Configuration';
    return 'TenderIQ AI';
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">{getPageTitle()}</h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">AI-Powered Tender Intelligence & Operations Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/compare"
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              <span>Compare</span>
            </Link>

            <Link
              to="/company-profile"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.company_name || 'Company Profile'}</span>
            </Link>

            <Link
              to="/tenders/upload"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Tender</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
