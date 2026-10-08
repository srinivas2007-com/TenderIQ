import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CompanyListItem, SampleTenderRequirements } from '../types';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  Users,
  Briefcase,
  TrendingUp,
  Globe,
  MapPin,
  FileCheck,
  ChevronRight,
  Layers,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [sampleTender, setSampleTender] = useState<SampleTenderRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEligibility, setFilterEligibility] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Company form state
  const [formData, setFormData] = useState({
    name: '',
    company_type: 'Private Limited Company',
    industry: 'Software Development & IT Services',
    location: '',
    state: 'Tamil Nadu',
    website: '',
    description: '',
    annual_turnover: 5.0,
    average_turnover: 4.5,
    years_in_business: 5,
    relevant_experience_years: 4,
    completed_projects_count: 15,
    workforce_count: 30,
    certifications: 'ISO 9001:2015, ISO 27001, GST Active Registrant',
    gst_number: '',
    pan_number: '',
    registration_number: '',
    technical_qualifications: 'Full-stack engineers, cloud architects, project managers'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compsRes, tenderRes] = await Promise.all([
        api.getCompanies(),
        api.getSampleFitTender()
      ]);
      setCompanies(compsRes);
      setSampleTender(tenderRes);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load companies directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const certList = formData.certifications
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      await api.createCompany({
        name: formData.name,
        company_type: formData.company_type,
        industry: formData.industry,
        location: formData.location,
        state: formData.state,
        website: formData.website,
        description: formData.description,
        annual_turnover: Number(formData.annual_turnover),
        average_turnover: Number(formData.average_turnover),
        years_in_business: Number(formData.years_in_business),
        relevant_experience_years: Number(formData.relevant_experience_years),
        completed_projects_count: Number(formData.completed_projects_count),
        workforce_count: Number(formData.workforce_count),
        certifications: certList,
        gst_number: formData.gst_number,
        pan_number: formData.pan_number,
        registration_number: formData.registration_number,
        technical_qualifications: formData.technical_qualifications
      });

      toast.success('Company profile created successfully!');
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create company profile');
    }
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filterEligibility === 'eligible') {
      return matchesSearch && c.is_eligible === true;
    }
    if (filterEligibility === 'not_eligible') {
      return matchesSearch && c.is_eligible === false;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
              Corporate Registry
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Enterprise Capability Profiles
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Company Management & Tender-Fit Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Maintain verified company profiles, track technical capabilities, and evaluate instant qualification against tender criteria.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Company Profile
          </button>
        </div>
      </div>

      {/* Benchmark Sample Tender Card */}
      {sampleTender && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-lg p-5 text-white shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold uppercase tracking-wider rounded">
                  Active Benchmark Tender
                </span>
                <span className="text-xs text-slate-400">{sampleTender.authority}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{sampleTender.title}</h2>
              <p className="text-xs text-slate-300">
                Companies in this directory are evaluated against the following mandatory tender eligibility criteria:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded border border-slate-700/60 shrink-0">
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Min Turnover</span>
                <span className="text-sm font-bold text-amber-400">₹{sampleTender.min_turnover_cr} Cr</span>
              </div>
              <div className="text-center px-2 border-l border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Min Experience</span>
                <span className="text-sm font-bold text-blue-400">{sampleTender.min_experience_years} Years</span>
              </div>
              <div className="text-center px-2 border-l border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Mandatory Cert</span>
                <span className="text-sm font-bold text-emerald-400">{sampleTender.mandatory_certification}</span>
              </div>
              <div className="text-center px-2 border-l border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Min Team Size</span>
                <span className="text-sm font-bold text-purple-400">{sampleTender.min_team_size} Staff</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies by name, industry, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterEligibility}
              onChange={(e) => setFilterEligibility(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Qualifications ({companies.length})</option>
              <option value="eligible">Eligible Only (✅)</option>
              <option value="not_eligible">Not Eligible (❌)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Table View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">
          <Building2 className="w-8 h-8 animate-pulse mx-auto text-blue-500 mb-3" />
          <p className="text-xs font-medium">Loading company registry & tender-fit scores...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">No companies match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search keywords or eligibility filter.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((comp) => {
            const isEligible = comp.is_eligible;
            const score = comp.fit_score || 0;

            return (
              <div
                key={comp.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {comp.is_sample && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                              Demo Enterprise
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-slate-500 truncate">
                            {comp.company_type || 'Enterprise'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {comp.industry || 'IT & Engineering Services'}
                        </p>
                      </div>

                      {/* Fit Score Badge */}
                      <div className="text-right shrink-0">
                        <div
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                            isEligible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isEligible ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>{score}/100</span>
                        </div>
                        <span className={`block text-[10px] font-semibold mt-0.5 ${isEligible ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50/60 border-b border-slate-100 text-center">
                    <div className="px-1 py-1 bg-white rounded border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block font-medium">Turnover</span>
                      <span className="text-xs font-bold text-slate-800">
                        ₹{comp.annual_turnover?.toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="px-1 py-1 bg-white rounded border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block font-medium">Experience</span>
                      <span className="text-xs font-bold text-slate-800">
                        {comp.years_in_business} Yrs
                      </span>
                    </div>
                    <div className="px-1 py-1 bg-white rounded border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block font-medium">Workforce</span>
                      <span className="text-xs font-bold text-slate-800">
                        {comp.workforce_count} Staff
                      </span>
                    </div>
                  </div>

                  {/* Location & Certifications */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{comp.location || 'Location Not Set'}, {comp.state || 'India'}</span>
                    </div>

                    {comp.website && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{comp.website}</span>
                      </div>
                    )}

                    {/* Certifications badges */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Certifications ({comp.certifications?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {comp.certifications && comp.certifications.length > 0 ? (
                          comp.certifications.slice(0, 3).map((cert, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                                cert.includes('27001')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {cert}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No certifications listed</span>
                        )}
                        {comp.certifications && comp.certifications.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded border border-slate-200">
                            +{comp.certifications.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/companies/${comp.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200/80 transition-colors"
                  >
                    <span>View Profile & Fit Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name & Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Turnover</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Workforce</th>
                  <th className="py-3 px-4">Certifications</th>
                  <th className="py-3 px-4 text-center">Fit Score</th>
                  <th className="py-3 px-4 text-center">Eligibility</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredCompanies.map((comp) => {
                  const isEligible = comp.is_eligible;
                  const score = comp.fit_score || 0;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{comp.name}</div>
                        <div className="text-[11px] text-slate-500">{comp.company_type} · {comp.industry}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {comp.location}, {comp.state}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        ₹{comp.annual_turnover?.toFixed(2)} Cr
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {comp.years_in_business} Years
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {comp.workforce_count} Staff
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {comp.certifications?.slice(0, 2).map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {c}
                            </span>
                          ))}
                          {comp.certifications && comp.certifications.length > 2 && (
                            <span className="text-[9px] text-slate-400 self-center">
                              +{comp.certifications.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                          isEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          isEligible ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isEligible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {isEligible ? 'Eligible' : 'Not Eligible'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/companies/${comp.id}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Company Profile</h3>
                <p className="text-xs text-slate-500">Register an enterprise profile for qualification evaluation</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Company Registered Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Zenith Infra Tech Pvt Ltd"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Company Type</label>
                  <select
                    value={formData.company_type}
                    onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Primary Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. Cloud Services & Software"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Operating City & State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City (e.g. Chennai)"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="text-xs px-2.5 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="text-xs px-2.5 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Annual Turnover (₹ Crores) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.annual_turnover}
                    onChange={(e) => setFormData({ ...formData, annual_turnover: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">3-Year Average Turnover (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.average_turnover}
                    onChange={(e) => setFormData({ ...formData, average_turnover: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Total Years in Business</label>
                  <input
                    type="number"
                    value={formData.years_in_business}
                    onChange={(e) => setFormData({ ...formData, years_in_business: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Workforce Headcount</label>
                  <input
                    type="number"
                    value={formData.workforce_count}
                    onChange={(e) => setFormData({ ...formData, workforce_count: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Certifications (comma separated)</label>
                <input
                  type="text"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder="e.g. ISO 9001:2015, ISO 27001, MSME Registered, GST Active Registrant"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Corporate Scope & Profile</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of core offerings, capabilities, and sector focus..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded border border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
