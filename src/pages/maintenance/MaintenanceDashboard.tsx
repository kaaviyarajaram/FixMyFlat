import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../lib/dataService';
import { Issue, IssueStatus } from '../../types';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Building2, 
  ChevronRight, 
  AlertTriangle, 
  Eye, 
  CheckCircle2, 
  RefreshCw, 
  Wrench,
  Search
} from 'lucide-react';

export const MaintenanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | IssueStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIssues = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await DataService.getIssues(user);
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues for staff', err);
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

  const pendingViewCount = useMemo(() => {
    return issues.filter(i => i.status === 'submitted').length;
  }, [issues]);

  const resolvedCount = useMemo(() => {
    return issues.filter(i => i.status === 'resolved').length;
  }, [issues]);

  // Breakdown counts for tab pills
  const submittedCount = useMemo(() => issues.filter(i => i.status === 'submitted').length, [issues]);
  const viewedCount = useMemo(() => issues.filter(i => i.status === 'viewed').length, [issues]);
  const inProgressCount = useMemo(() => issues.filter(i => i.status === 'in_progress').length, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      const matchesStatus = filter === 'all' ? true : i.status === filter;
      const matchesSearch = searchQuery.trim() === ''
        ? true
        : i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [issues, filter, searchQuery]);

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

      if (isToday) return `Today , ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Top Header */}
      <Header />

      <main className="flex-1 px-5 pt-2 pb-6 space-y-4">
        {/* Staff Profile Card matching Figma */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Staff Member'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
              {user?.name || 'Graham Garette'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{user?.apartment_id || 'Oakridge Heights, Apt 4B'}</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Grid matching Figma */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Active issue card */}
          <div className="bg-[#FFFDF7] rounded-2xl p-3 border border-amber-100/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold text-amber-900 leading-tight">
                Active issue
              </span>
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <AlertTriangle className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-slate-900">
                {activeCount}
              </span>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                Pending maintenance
              </p>
            </div>
          </div>

          {/* Pending view card */}
          <div className="bg-[#F4F9FF] rounded-2xl p-3 border border-blue-100/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold text-blue-900 leading-tight">
                Pending view
              </span>
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Eye className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-slate-900">
                {pendingViewCount}
              </span>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                Needs review
              </p>
            </div>
          </div>

          {/* Resolved card */}
          <div className="bg-[#F6FDF9] rounded-2xl p-3 border border-emerald-100/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold text-emerald-950 leading-tight">
                Resolved
              </span>
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-slate-900">
                {resolvedCount}
              </span>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                Closed this month
              </p>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location or category..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Filter Tabs matching Figma horizontal scrollable pills */}
        <div className="overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-max min-w-full">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({issues.length})
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                filter === 'submitted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Submitted ({submittedCount})
            </button>
            <button
              onClick={() => setFilter('viewed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                filter === 'viewed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Viewed ({viewedCount})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                filter === 'in_progress'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Under Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                filter === 'resolved'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Issue Cards */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading issues...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center shadow-xs">
              <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900">No issues found</h3>
              <p className="text-xs text-slate-500 mt-1">
                There are no issues matching the current status filter.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/maintenance/issues/${issue.id}`)}
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

                {/* Bottom: Date & Update Status CTA */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50 text-xs">
                  <span className="text-slate-400 font-medium">
                    {formatIssueDate(issue.created_at)}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Update Status</span>
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
