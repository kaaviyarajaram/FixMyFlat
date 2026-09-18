import React from 'react';
import { Wifi, Battery } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:py-6 sm:px-4">
      {/* Main Container - Responsive on all screen sizes */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200/90 flex flex-col overflow-hidden relative transition-all">
        {/* Status Bar (matching 9:40 iOS bar from Figma) */}
        <div className="flex items-center justify-between px-7 pt-3 pb-1 select-none text-slate-900 text-xs font-bold">
          <span>9:40</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            <Battery className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>

        {/* Bottom Home Indicator Bar (matches Figma) */}
        <div className="py-2 flex justify-center bg-transparent select-none">
          <div className="w-32 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
};
