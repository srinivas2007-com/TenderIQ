import React from 'react';
import { api } from '../../services/api';
import { ExternalLink, FileText, Download } from 'lucide-react';

interface TenderPdfTabProps {
  tenderId: string;
  currentPage?: number;
  fileName: string;
}

export const TenderPdfTab: React.FC<TenderPdfTabProps> = ({
  tenderId,
  currentPage = 1,
  fileName
}) => {
  const pdfUrl = `${api.getTenderPdfUrl(tenderId)}#page=${currentPage}`;

  return (
    <div className="space-y-4">
      {/* PDF Header Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold text-slate-800">{fileName}</span>
          <span className="text-xs text-slate-400 font-mono">
            {currentPage ? `• Viewing Target Page ${currentPage}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getTenderPdfUrl(tenderId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in New Window
          </a>

          <a
            href={api.getTenderPdfUrl(tenderId)}
            download={fileName}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </a>
        </div>
      </div>

      {/* Embedded PDF Viewer */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm h-[750px]">
        <iframe
          src={pdfUrl}
          title={fileName}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};
