import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F8FAFC] flex flex-col w-full text-slate-900 antialiased">
      {children}
    </div>
  );
};

