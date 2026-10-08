import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { TenderDocument } from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Edit2,
  Save,
  Loader2,
  FileUp
} from 'lucide-react';

interface TenderDocumentsTabProps {
  tenderId: string;
  onNavigateToPage?: (pageNum: number) => void;
}

export const TenderDocumentsTab: React.FC<TenderDocumentsTabProps> = ({
  tenderId,
  onNavigateToPage
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<TenderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [targetUploadDoc, setTargetUploadDoc] = useState<TenderDocument | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getTenderDocuments(tenderId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents checklist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [tenderId]);

  const toggleStatus = async (doc: TenderDocument) => {
    let nextStatus: 'READY' | 'PARTIAL' | 'MISSING' = 'READY';
    if (doc.status === 'READY') nextStatus = 'PARTIAL';
    else if (doc.status === 'PARTIAL') nextStatus = 'MISSING';
    else nextStatus = 'READY';

    try {
      const updated = await api.updateTenderDocument(tenderId, doc.id, {
        status: nextStatus,
      });
      setDocuments(documents.map((d) => (d.id === doc.id ? updated : d)));
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleSaveNotes = async (docId: string) => {
    setUpdating(true);
    try {
      const updated = await api.updateTenderDocument(tenderId, docId, {
        notes: editNotes,
      });
      setDocuments(documents.map((d) => (d.id === docId ? updated : d)));
      setEditingId(null);
      toast.success('Document notes updated.');
    } catch (err) {
      toast.error('Failed to save notes.');
    } finally {
      setUpdating(false);
    }
  };

  const triggerUploadForDoc = (doc: TenderDocument) => {
    setTargetUploadDoc(doc);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadDoc) return;

    setUploadingDocId(targetUploadDoc.id);
    try {
      // 1. Upload to company documents repository
      const fd = new FormData();
      fd.append('doc_type', targetUploadDoc.category || 'Tender Compliance');
      fd.append('name', targetUploadDoc.name);
      fd.append('file', file);
      await api.uploadCompanyDocument(fd);

      // 2. Mark this tender checklist document as READY
      const updated = await api.updateTenderDocument(tenderId, targetUploadDoc.id, {
        status: 'READY',
        notes: `Uploaded: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
      });

      setDocuments((prev) => prev.map((d) => (d.id === targetUploadDoc.id ? updated : d)));
      toast.success(`Uploaded "${file.name}" and marked "${targetUploadDoc.name}" as READY!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDocId(null);
      setTargetUploadDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const readyCount = documents.filter((d) => d.status === 'READY').length;
  const partialCount = documents.filter((d) => d.status === 'PARTIAL').length;
  const missingCount = documents.filter((d) => d.status === 'MISSING').length;

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs">Loading document checklist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for document upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.png,.jpg,.jpeg,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Ready Tracker Summary Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Mandatory Tender Packet
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-slate-900">
              Documents Ready: {readyCount} / {documents.length}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              ({Math.round((readyCount / Math.max(1, documents.length)) * 100)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            ✓ {readyCount} Ready
          </span>
          <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            ⚠ {partialCount} Partial
          </span>
          <span className="px-2.5 py-1 rounded bg-red-50 text-red-800 border border-red-200 font-medium">
            ✕ {missingCount} Missing
          </span>
        </div>
      </div>

      {/* Missing Documents Alert Banner if any */}
      {missingCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{missingCount} document(s) missing:</strong> Click "Upload File" next to any item below to upload the required certificate and mark it Ready.
            </span>
          </div>
        </div>
      )}

      {/* Documents Checklist Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">Status</th>
              <th className="py-3 px-4">Document Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Audit Notes / Verification</th>
              <th className="py-3 px-4 text-center">Source</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No required documents identified in this tender.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Status Toggle Button */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleStatus(doc)}
                      title="Click to toggle status: Ready / Partial / Missing"
                      className="cursor-pointer"
                    >
                      {doc.status === 'READY' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 hover:text-emerald-700" />
                      ) : doc.status === 'PARTIAL' ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 hover:text-amber-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 hover:text-red-600" />
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{doc.name}</span>
                      {doc.mandatory && (
                        <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded">
                          Mandatory
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                    {doc.category || 'Statutory'}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                    {editingId === doc.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                        <button
                          onClick={() => handleSaveNotes(doc.id)}
                          disabled={updating}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-600">{doc.notes || 'No specific notes recorded'}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {doc.source_page ? (
                      <button
                        onClick={() => onNavigateToPage?.(doc.source_page!)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 px-2 py-1 rounded hover:bg-brand-100"
                      >
                        Page {doc.source_page}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">-</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerUploadForDoc(doc)}
                        disabled={uploadingDocId === doc.id}
                        title={`Upload file for ${doc.name}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          doc.status === 'READY'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {uploadingDocId === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <FileUp className="w-3 h-3" />
                        )}
                        <span>{doc.status === 'READY' ? 'Re-upload' : 'Upload File'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(doc.id);
                          setEditNotes(doc.notes || '');
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded"
                        title="Edit verification notes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
