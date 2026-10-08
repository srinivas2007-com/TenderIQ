import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Company, CompanyDocument } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  DollarSign,
  Briefcase,
  Award,
  FileCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Upload,
  FileText,
  UploadCloud,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CompanyProfilePage: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('GST Certificate');
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileData, docsData] = await Promise.all([
        api.getCompanyProfile(),
        api.getCompanyDocuments(),
      ]);
      setCompany(profileData);
      setDocuments(docsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company) return;
    setSaving(true);

    try {
      const updated = await api.updateCompanyProfile(company);
      setCompany(updated);
      toast.success('Company profile updated successfully! Tender evaluations and tasks have been updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('doc_type', uploadDocType);
      fd.append('name', uploadDocName || uploadFile.name);
      fd.append('file', uploadFile);

      const newDoc = await api.uploadCompanyDocument(fd);
      setDocuments(prev => [...prev, newDoc]);
      setUploadFile(null);
      setUploadDocName('');
      toast.success(`Uploaded ${newDoc.name} successfully!`);
      // Refresh profile to reflect any completeness changes
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await api.deleteCompanyDocument(docId);
      setDocuments(prev => prev.filter((d) => d.id !== docId));
      toast.info('Document removed from repository.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document.');
    }
  };

  const handleAddTurnoverYear = () => {
    if (!company) return;
    const history = [...(company.turnover_history || [])];
    const yearNumber = 2024 - history.length;
    history.push({ year: `FY ${yearNumber - 1}-${String(yearNumber).slice(-2)}`, turnover: 0.0 });
    setCompany({ ...company, turnover_history: history });
  };

  const handleUpdateTurnover = (index: number, field: 'year' | 'turnover', value: any) => {
    if (!company) return;
    const history = [...company.turnover_history];
    history[index] = { ...history[index], [field]: value };
    // Also recompute average turnover
    const sum = history.reduce((acc, curr) => acc + (Number(curr.turnover) || 0), 0);
    const avg = history.length > 0 ? parseFloat((sum / history.length).toFixed(2)) : 0;
    setCompany({
      ...company,
      turnover_history: history,
      average_turnover: avg,
    });
  };

  const handleRemoveTurnover = (index: number) => {
    if (!company) return;
    const history = company.turnover_history.filter((_, i) => i !== index);
    const sum = history.reduce((acc, curr) => acc + (Number(curr.turnover) || 0), 0);
    const avg = history.length > 0 ? parseFloat((sum / history.length).toFixed(2)) : 0;
    setCompany({
      ...company,
      turnover_history: history,
      average_turnover: avg,
    });
  };

  const toggleCertification = (cert: string) => {
    if (!company) return;
    const certs = company.certifications || [];
    if (certs.includes(cert)) {
      setCompany({ ...company, certifications: certs.filter((c) => c !== cert) });
    } else {
      setCompany({ ...company, certifications: [...certs, cert] });
    }
  };

  if (loading || !company) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-medium">Loading enterprise company profile...</p>
      </div>
    );
  }

  const standardCerts = [
    'ISO 9001:2015',
    'ISO 14001:2015',
    'ISO 27001',
    'MSME / Udyam Registered',
    'CMMI Level 3+',
    'GST Active Registrant',
    'BIS Standard Certified',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Profile & Credentials</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Indian Tender Eligibility & Bid Decision Platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700">
            <span>{user?.email || company.name}</span>
          </div>
          <button
            onClick={() => navigate('/tenders/upload')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Tender
          </button>
        </div>
      </div>

      {/* Completeness & Save Spotlight Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">{company.name || user?.email}</h2>
          </div>
          <p className="text-xs text-slate-500">
            {company.company_type || 'Private Limited Company'} • {company.industry || 'Civil Construction & Infrastructure'} • {company.location || 'Location'}, {company.country || 'India'}
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="w-52 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Profile Completeness</span>
              <span className="text-blue-600 font-bold">{company.completeness_percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${company.completeness_percentage}%` }}
              />
            </div>
            {company.missing_items && company.missing_items.length > 0 ? (
              <p className="text-[10px] text-amber-700 font-medium truncate">
                Missing: {company.missing_items.slice(0, 2).join(', ')}
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Profile 100% Verified
              </p>
            )}
          </div>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={(e) => handleSave(e)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Basic Corporate Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Registered Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.name || ''}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                value={company.company_type || 'Private Limited Company'}
                onChange={(e) => setCompany({ ...company, company_type: e.target.value })}
              >
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Public Limited Company">Public Limited Company</option>
                <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                <option value="Partnership Firm">Partnership Firm</option>
                <option value="Proprietorship">Proprietorship</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Industry</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.industry || ''}
                onChange={(e) => setCompany({ ...company, industry: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating Location / City</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.location || ''}
                onChange={(e) => setCompany({ ...company, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State / UT</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.state || ''}
                onChange={(e) => setCompany({ ...company, state: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                placeholder="https://company.in"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.website || ''}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Corporate Profile & Scope</label>
              <textarea
                rows={2}
                placeholder="Brief summary of core line of business and capability..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.description || ''}
                onChange={(e) => setCompany({ ...company, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financial Information & Turnover History */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Financial Information & Audited Turnover</h3>
            </div>
            <button
              type="button"
              onClick={handleAddTurnoverYear}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-3.5 h-3.5" /> Add Financial Year
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latest FY Annual Turnover (₹ Crores)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold"
                value={company.annual_turnover ? company.annual_turnover : ''}
                onChange={(e) => setCompany({ ...company, annual_turnover: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Average Turnover Last 3 FYs (₹ Crores)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold"
                value={company.average_turnover ? company.average_turnover : ''}
                onChange={(e) => setCompany({ ...company, average_turnover: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Turnover History Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Financial Year</th>
                  <th className="py-2.5 px-3">Audited Turnover (₹ in Crores)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(company.turnover_history || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-center text-slate-400 italic">
                      No financial years added yet. Click "+ Add Financial Year" above.
                    </td>
                  </tr>
                ) : (
                  company.turnover_history.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          value={item.year}
                          onChange={(e) => handleUpdateTurnover(idx, 'year', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                          value={item.turnover ? item.turnover : ''}
                          onChange={(e) => handleUpdateTurnover(idx, 'turnover', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveTurnover(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Operating Experience & Track Record */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Experience & Track Record</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Years in Business</label>
              <input
                type="number"
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.years_in_business ? company.years_in_business : ''}
                onChange={(e) => setCompany({ ...company, years_in_business: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Relevant Domain Experience (Years)</label>
              <input
                type="number"
                placeholder="e.g. 3"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.relevant_experience_years ? company.relevant_experience_years : ''}
                onChange={(e) => setCompany({ ...company, relevant_experience_years: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Completed Similar Projects</label>
              <input
                type="number"
                placeholder="e.g. 12"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={company.completed_projects_count ? company.completed_projects_count : ''}
                onChange={(e) => setCompany({ ...company, completed_projects_count: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Major Completed Projects Description</label>
            <textarea
              rows={3}
              placeholder="List significant completed projects with client names and contract values (e.g. NHAI Highway Section ₹8 Cr, PWD Admin Tower ₹12 Cr)..."
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              value={company.similar_projects_desc || ''}
              onChange={(e) => setCompany({ ...company, similar_projects_desc: e.target.value })}
            />
          </div>
        </div>

        {/* Section 4: Certifications & Technical Capabilities */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Award className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Technical Services, Capabilities & Certifications</h3>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Active Certifications & Credentials</label>
            <div className="flex flex-wrap gap-2">
              {standardCerts.map((cert) => {
                const active = (company.certifications || []).includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCertification(cert)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {cert}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Core Technical Services & Capabilities (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Civil Construction, Road Works, IT Infrastructure, Cloud Solutions, Smart City IoT, HVAC Installation"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={Array.isArray(company.services) ? company.services.join(', ') : (company.services || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  const parts = val.split(',').map(s => s.trim()).filter(Boolean);
                  setCompany({ ...company, services: parts });
                }}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your key capability domains or specialized trade services to match tender scope requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workforce / Team Count</label>
                <input
                  type="number"
                  placeholder="Number of full-time personnel"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  value={company.workforce_count ? company.workforce_count : ''}
                  onChange={(e) => setCompany({ ...company, workforce_count: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technical Qualifications & Key Personnel</label>
                <input
                  type="text"
                  placeholder="e.g. Certified Civil Engineers, Project Managers (PMP), AWS Solutions Architects"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  value={company.technical_qualifications || ''}
                  onChange={(e) => setCompany({ ...company, technical_qualifications: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Legal & Statutory Registrations */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <FileCheck className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Statutory & Tax Compliance</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                placeholder="27AAACA1234A1Z5"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                value={company.gst_number || ''}
                onChange={(e) => setCompany({ ...company, gst_number: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company PAN Card</label>
              <input
                type="text"
                placeholder="AAACA1234A"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                value={company.pan_number || ''}
                onChange={(e) => setCompany({ ...company, pan_number: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">CIN / Registration No</label>
              <input
                type="text"
                placeholder="U72900MH2020PTC..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                value={company.registration_number || ''}
                onChange={(e) => setCompany({ ...company, registration_number: e.target.value })}
              />
            </div>
          </div>
        </div>
      </form>

      {/* Section 6: Verified Documents Repository */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Uploaded Credential Documents</h3>
            <p className="text-xs text-slate-500">Attach certificates to enable automatic document checklist validation</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            {documents.length} Uploaded
          </span>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadDocument} className="bg-slate-50 p-4 rounded border border-slate-200 mb-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none"
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
              >
                <option value="GST Certificate">GST Certificate</option>
                <option value="PAN Card">PAN Card</option>
                <option value="ISO 9001 Certificate">ISO Certificate</option>
                <option value="Audited Balance Sheet">Audited Balance Sheet</option>
                <option value="Completion Certificate">Completion Certificate</option>
                <option value="MSME / Udyam Certificate">MSME / Udyam Certificate</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select File (PDF)</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={uploadingDoc || !uploadFile}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded transition-colors disabled:opacity-50"
              >
                {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload Credential
              </button>
            </div>
          </div>
        </form>

        {/* Documents List */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded">
          {documents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No documents uploaded yet. Upload GST, PAN, or ISO certificates above.
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="py-3 px-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">{doc.name}</span>
                    <span className="text-[11px] text-slate-400 block">{doc.doc_type} • {(doc.file_size / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
