import React from 'react';
import { IssueStatus } from '../../types';

interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Submitted',
          classes: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]', // subtle clean blue-gray
        };
      case 'viewed':
        return {
          label: 'Viewed',
          classes: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
        };
      case 'in_progress':
        return {
          label: 'Under Process',
          classes: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
        };
      case 'resolved':
        return {
          label: 'Resolved',
          classes: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
        };
      default:
        return {
          label: status,
          classes: 'bg-slate-100 text-slate-600 border border-slate-200',
        };
    }
  };

  const config = getBadgeConfig();
  const padding = size === 'sm' ? 'px-3 py-1 text-xs font-semibold' : 'px-3.5 py-1.5 text-sm font-semibold';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full transition-colors ${padding} ${config.classes}`}
    >
      {config.label}
    </span>
  );
};
