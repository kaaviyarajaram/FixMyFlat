import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataService } from '../../lib/dataService';
import { Issue, IssueStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Timeline } from '../../components/common/Timeline';
import { ImageModal } from '../../components/common/ImageModal';
import { 
  ChevronLeft, 
  Building2, 
  RefreshCw, 
  ImageIcon, 
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export const MaintenanceIssueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>('submitted');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const fetchIssue = async () => {
    if (!id) return;
    try {
      const data = await DataService.getIssueById(id);
      if (data) {
        setIssue(data);
        setSelectedStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to load issue details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id || !issue) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const updated = await DataService.updateIssueStatus(id, selectedStatus);
      setIssue(updated);
      setFeedback({
        type: 'success',
        text: `Status updated successfully to ${
          selectedStatus === 'in_progress' ? 'Under Process' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)
        }!`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update status. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

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

      if (isToday) return `Today , ${timeStr}`;
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
            onClick={() => navigate('/maintenance')}
            className="flex items-center gap-1 text-slate-800 hover:text-blue-600 text-sm font-bold"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Issue Not Found</h2>
          <button
            onClick={() => navigate('/maintenance')}
            className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Create preview issue for timeline to show live selection
  const previewIssue: Issue = {
    ...issue,
    status: selectedStatus,
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 bg-white">
        <button
          onClick={() => navigate('/maintenance')}
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

      {/* Main Content */}
      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto pb-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
        )}

        {/* Issue Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          {/* Header: Title & Status Badge */}
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

          {/* Description & Photo */}
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
                    alt="Attachment"
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

        {/* Update Status Section matching Figma */}
        <div className="space-y-1.5">
          <label className="block text-sm font-extrabold text-slate-900">
            Update Status
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
              className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all cursor-pointer shadow-2xs"
            >
              <option value="submitted">Submitted</option>
              <option value="viewed">Viewed</option>
              <option value="in_progress">Under Process</option>
              <option value="resolved">Resolved</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <Timeline issue={previewIssue} />

        {/* Bottom Update Status Action Button */}
        <div className="pt-2">
          <button
            onClick={handleStatusUpdate}
            disabled={updating}
            className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/25 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating status...</span>
              </>
            ) : (
              <span>Update Status</span>
            )}
          </button>
        </div>
      </main>

      {/* Photo Lightbox Modal */}
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
