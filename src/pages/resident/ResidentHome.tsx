import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../lib/dataService';
import { Issue } from '../../types';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Building2, 
  ChevronRight, 
  FileQuestion,
  RefreshCw
} from 'lucide-react';

export const ResidentHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const fetchIssues = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await DataService.getIssues(user);
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [user]);

  // Metric counts
  const activeCount = useMemo(() => {
    return issues.filter(i => i.status !== 'resolved').length;
  }, [issues]);

  const resolvedCount = useMemo(() => {
    return issues.filter(i => i.status === 'resolved').length;
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    if (filter === 'active') {
      return issues.filter(i => i.status !== 'resolved');
    }
    if (filter === 'resolved') {
      return issues.filter(i => i.status === 'resolved');
    }
    return issues;
  }, [issues, filter]);

  // Helper for relative / clean date
  const formatIssueDate = (isoString: string) => {
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

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Top Bar */}
      <Header />

      <main className="flex-1 px-5 pt-2 pb-6 space-y-4">
        {/* User Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Resident'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
              {user?.name || 'Alex Walter'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{user?.apartment_id || 'Oakridge Heights, Apt 4B'}</span>
            </div>
          </div>
        </div>

        {/* 2 Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Active issues card */}
          <div className="bg-[#FFFDF7] rounded-2xl p-4 border border-amber-100/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-amber-900/90 leading-tight">
                Active issues
              </span>
              <div className="w-6 h-6 rounded-full bg-amber-100/90 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeCount}
              </span>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Pending maintenance
              </p>
            </div>
          </div>

          {/* Resolved card */}
          <div className="bg-[#F6FDF9] rounded-2xl p-4 border border-emerald-100/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-emerald-950/90 leading-tight">
                Resolved
              </span>
              <div className="w-6 h-6 rounded-full bg-emerald-100/90 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {resolvedCount}
              </span>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Closed this month
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action: Report an issue */}
        <button
          onClick={() => navigate('/resident/report')}
          className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all group"
        >
          <Plus className="w-4 h-4 stroke-[3] transition-transform group-hover:rotate-90" />
          <span>Report an issue</span>
        </button>

        {/* Filter Segmented Control */}
        <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'resolved'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Issues List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading issues...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No issues found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {filter === 'all'
                  ? "You haven't reported any apartment maintenance issues yet."
                  : `No ${filter} issues at the moment.`}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => navigate('/resident/report')}
                  className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report your first issue</span>
                </button>
              )}
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/resident/issues/${issue.id}`)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-blue-200 transition-all cursor-pointer group"
              >
                {/* Top: Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                    {issue.title}
                  </h3>
                  <div className="flex-shrink-0">
                    <StatusBadge status={issue.status} />
                  </div>
                </div>

                {/* Middle: Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{issue.location}</span>
                </div>

                {/* Bottom: Date & View Detail CTA */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50 text-xs">
                  <span className="text-slate-400 font-medium">
                    {formatIssueDate(issue.created_at)}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>View Detail</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
