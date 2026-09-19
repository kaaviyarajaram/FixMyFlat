import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getInitialsAvatar } from '../../context/AuthContext';
import { LogOut, ShieldCheck, Home } from 'lucide-react';

interface HeaderProps {
  showRoleBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showRoleBadge = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/60 sticky top-0 z-30 select-none">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate(user?.role === 'maintenance' ? '/maintenance' : '/resident')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
            {/* Building SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 21V9l7-4 7 4v12H4zm2-2h3v-3H6v3zm0-5h3v-3H6v3zm5 5h3v-3h-3v3zm0-5h3v-3h-3v3zm5 5h3v-3h-3v3zm0-5h3v-3h-3v3z"/>
            </svg>
            {/* Checkmark circular badge */}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#16A34A] border-2 border-white flex items-center justify-center">
              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <span className="font-extrabold text-[1.25rem] tracking-tight text-slate-900">
            Fixmy<span className="text-slate-900 font-bold">Flat</span>
          </span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Role Segmented Pill (matches Figma design) */}
          {showRoleBadge && user && (
            <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/80 text-xs font-semibold">
              <span
                className={`px-3 py-1 rounded-full transition-all ${
                  user.role === 'resident'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Resident
              </span>
              <span
                className={`px-3 py-1 rounded-full transition-all ${
                  user.role === 'maintenance'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Staff
              </span>
            </div>
          )}

          {/* Profile Circle with Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              title="Profile & Settings"
            >
              {user?.avatar_url && !user.avatar_url.includes('unsplash') ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <img
                  src={getInitialsAvatar(user?.name || 'User', user?.role)}
                  alt={user?.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-blue-600 capitalize">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Role: {user?.role}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(user?.role === 'maintenance' ? '/maintenance' : '/resident');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>Dashboard Home</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
