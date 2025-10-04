import { useState } from 'react';
import { Download, FileText, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDataExport } from '../../hooks/useDataExport';
import { useSubscription } from '../../hooks/useSubscription';

export default function DataExport() {
  const { loading, error, exportToCSV, exportToPDF } = useDataExport();
  const { canExportData } = useSubscription();
  const [dateRange, setDateRange] = useState<'all' | '30' | '90'>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    if (!canExportData()) {
      alert('Data export is a premium feature. Please upgrade to access this functionality.');
      return;
    }

    const now = new Date();
    let startDate: string | undefined;

    if (dateRange === '30') {
      const date = new Date(now);
      date.setDate(date.getDate() - 30);
      startDate = date.toISOString().split('T')[0];
    } else if (dateRange === '90') {
      const date = new Date(now);
      date.setDate(date.getDate() - 90);
      startDate = date.toISOString().split('T')[0];
    }

    const success = exportFormat === 'csv'
      ? await exportToCSV(startDate)
      : await exportToPDF(startDate);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Download className="text-emerald-600" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Export Your Data</h3>
          <p className="text-sm text-slate-600">
            Download your reflections, progress, and achievements
          </p>
        </div>
      </div>

      {!canExportData() && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="text-amber-600 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Premium Feature</h4>
            <p className="text-sm text-amber-800">
              Upgrade to Premium to export your data as CSV files. Perfect for sharing with your coach or keeping personal backups.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-slate-800 mb-3">Export Format</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value as 'csv')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-slate-700">CSV (Spreadsheet)</span>
                <p className="text-xs text-slate-500">Compatible with Excel, Google Sheets</p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-slate-700">PDF (Formatted Report)</span>
                <p className="text-xs text-slate-500">Beautiful formatted document for printing or sharing</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-slate-800 mb-3">Date Range</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateRange"
                value="all"
                checked={dateRange === 'all'}
                onChange={(e) => setDateRange(e.target.value as 'all')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">All time</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateRange"
                value="90"
                checked={dateRange === '90'}
                onChange={(e) => setDateRange(e.target.value as '90')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Last 90 days</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateRange"
                value="30"
                checked={dateRange === '30'}
                onChange={(e) => setDateRange(e.target.value as '30')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Last 30 days</span>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 mb-2">What's Included</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              All daily reflections and intentions
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              Completion status and ratings
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              Tips and action items
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              Earned badges and achievements
            </li>
          </ul>
        </div>

        <button
          onClick={handleExport}
          disabled={loading || !canExportData()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Preparing Export...
            </>
          ) : (
            <>
              <Download size={20} />
              Export to {exportFormat.toUpperCase()}
            </>
          )}
        </button>

        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
            <p className="text-sm text-emerald-800">
              Your data has been successfully exported! Check your downloads folder.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-medium text-slate-800 mb-2">Privacy Note</h4>
        <p className="text-sm text-slate-600">
          Your data export is generated locally in your browser and downloaded directly to your device.
          We do not store or transmit your exported data through external servers.
        </p>
      </div>
    </div>
  );
}
