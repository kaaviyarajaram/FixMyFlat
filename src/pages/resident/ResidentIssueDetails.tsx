import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataService } from '../../lib/dataService';
import { Issue } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Timeline } from '../../components/common/Timeline';
import { ImageModal } from '../../components/common/ImageModal';
import { 
  ChevronLeft, 
  Building2, 
  RefreshCw, 
  ImageIcon, 
  AlertCircle 
} from 'lucide-react';

export const ResidentIssueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchIssue = async (isManualRefresh = false) => {
    if (!id) return;
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await DataService.getIssueById(id);
      setIssue(data);
      if (isManualRefresh) {
        setToastMessage('Status updated');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error('Failed to fetch issue', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const formatHeaderDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading issue details...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center px-5 pt-3 pb-3 border-b border-slate-100">
          <button
            onClick={() => navigate('/resident')}
            className="flex items-center gap-1 text-slate-800 hover:text-blue-600 text-sm font-bold"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Issue Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            This issue could not be found or you may not have access to view it.
          </p>
          <button
            onClick={() => navigate('/resident')}
            className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] relative">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 bg-white">
        <button
          onClick={() => navigate('/resident')}
          className="flex items-center gap-1 text-slate-800 hover:text-blue-600 transition-colors text-sm font-bold"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span>Back</span>
        </button>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
          Issue Details
        </h1>
        <div className="w-12" />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto pb-20">
        {/* Issue Details Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          {/* Header Row: Title & Badge */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
              {issue.title}
            </h2>
            <div className="flex-shrink-0">
              <StatusBadge status={issue.status} />
            </div>
          </div>

          {/* Location & Date */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{issue.location}</span>
            </div>
            <span className="text-slate-400 flex-shrink-0 font-medium text-[11px]">
              {formatHeaderDate(issue.created_at)}
            </span>
          </div>

          {/* Category */}
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Category : <span className="text-slate-700 font-semibold">{issue.category || 'General'}</span>
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-slate-100" />

          {/* Description & Photo Row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 mb-1">Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {issue.description}
              </p>
            </div>

            {/* Photo Thumbnail */}
            {issue.photo_url && (
              <div className="flex-shrink-0 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setModalImage(issue.photo_url || null)}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:opacity-90 transition-opacity relative group"
                >
                  <img
                    src={issue.photo_url}
                    alt="Issue attachment"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </button>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  Photo (1)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Timeline Component */}
        <Timeline issue={issue} />
      </main>

      {/* Floating Refresh Status Button matching Figma screenshot */}
      <div className="absolute bottom-6 right-6 z-30">
        <button
          onClick={() => fetchIssue(true)}
          disabled={refreshing}
          className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-md text-slate-700 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all active:scale-95 group"
          title="Refresh status"
        >
          <RefreshCw
            className={`w-5 h-5 transition-transform ${
              refreshing ? 'animate-spin text-blue-600' : 'group-hover:rotate-45'
            }`}
          />
        </button>
      </div>

      {/* Full Photo Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage}
          isOpen={Boolean(modalImage)}
          onClose={() => setModalImage(null)}
          title={issue.title}
        />
      )}
    </div>
  );
};
