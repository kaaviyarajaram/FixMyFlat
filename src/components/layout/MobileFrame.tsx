import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:py-6 sm:px-4">
      {/* Main Container - Responsive on all screen sizes */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200/90 flex flex-col overflow-hidden relative transition-all">
        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

