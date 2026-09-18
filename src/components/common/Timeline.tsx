import React from 'react';
import { Issue, IssueStatus } from '../../types';
import { Check } from 'lucide-react';

interface TimelineProps {
  issue: Issue;
}

export const Timeline: React.FC<TimelineProps> = ({ issue }) => {
  // Determine order index
  const getStatusLevel = (status: IssueStatus): number => {
    switch (status) {
      case 'submitted': return 1;
      case 'viewed': return 2;
      case 'in_progress': return 3;
      case 'resolved': return 4;
      default: return 1;
    }
  };

  const currentLevel = getStatusLevel(issue.status);

  // Format date helper
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Pending';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Pending';
    }
  };

  // Relative updated time helper
  const getRelativeUpdated = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Updated just now';
      if (diffMins < 60) return `Updated ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Updated ${diffHours}h ago`;
      return `Updated ${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Updated recently';
    }
  };

  const steps = [
    {
      id: 'submitted',
      level: 1,
      title: 'Submitted',
      subtitle: 'Your issue has been reported.',
      date: formatDate(issue.submitted_at),
      color: '#2563EB',
    },
    {
      id: 'viewed',
      level: 2,
      title: 'Viewed',
      subtitle: 'The maintenance team has seen your issue.',
      date: formatDate(issue.viewed_at),
      color: '#0284C7',
    },
    {
      id: 'in_progress',
      level: 3,
      title: 'Under Process',
      subtitle: 'The maintenance team is working on it.',
      date: formatDate(issue.in_progress_at),
      color: '#EA580C',
    },
    {
      id: 'resolved',
      level: 4,
      title: 'Resolved',
      subtitle: 'Your issue has been fixed.',
      date: formatDate(issue.resolved_at),
      color: '#16A34A',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100/90 shadow-sm p-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-50">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          TRACKING TIMELINE
        </span>
        <span className="text-xs font-medium text-slate-400">
          {getRelativeUpdated(issue.updated_at || issue.created_at)}
        </span>
      </div>

      {/* Steps list */}
      <div className="relative pt-1 pb-1">
        {steps.map((step, idx) => {
          const isPassed = currentLevel > step.level;
          const isCurrent = currentLevel === step.level;
          const isPending = currentLevel < step.level;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className="absolute left-[13px] top-6 bottom-0 w-[2px] -z-0 transition-colors duration-300"
                  style={{
                    backgroundColor: currentLevel > step.level ? step.color : '#E2E8F0',
                  }}
                />
              )}

              {/* Node Icon */}
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
                {isPassed && (
                  <div
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center bg-white shadow-xs"
                    style={{ borderColor: step.color, color: step.color }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {isCurrent && (
                  <div
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center bg-white shadow-xs"
                    style={{ borderColor: step.color }}
                  >
                    {/* If resolved is current, show checkmark; otherwise show concentric active dot */}
                    {step.id === 'resolved' ? (
                      <Check className="w-4 h-4 stroke-[3] text-[#16A34A]" />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: step.color }}
                      />
                    )}
                  </div>
                )}

                {isPending && (
                  <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold leading-tight ${
                      isPending ? 'text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </h4>
                </div>

                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {step.date}
                </p>

                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isPending ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
