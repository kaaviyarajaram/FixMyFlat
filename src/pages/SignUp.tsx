import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Key, Eye, EyeOff, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!accessCode.trim()) {
      setError('Please enter the access code provided by your building management.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(name, email, password, accessCode);
      if (res.success && res.role) {
        if (res.requiresEmailConfirmation) {
          setSuccessMsg(res.message || 'Account created! Please check your email for the confirmation link.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setSuccessMsg(`Account created successfully as ${res.role === 'resident' ? 'Resident' : 'Maintenance Staff'}! Redirecting...`);
          setTimeout(() => {
            if (res.role === 'maintenance') {
              navigate('/maintenance');
            } else {
              navigate('/resident');
            }
          }, 1200);
        }
      } else {
        setError(res.error || 'Failed to create account. Please check your access code.');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 sm:px-8 bg-white overflow-y-auto">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-2 pt-2 pb-5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 21V9l7-4 7 4v12H4zm2-2h3v-3H6v3zm0-5h3v-3H6v3zm5 5h3v-3h-3v3zm0-5h3v-3h-3v3zm5 5h3v-3h-3v3zm0-5h3v-3h-3v3z" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#16A34A] border-2 border-white flex items-center justify-center">
              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <span className="font-extrabold text-[1.3rem] tracking-tight text-slate-900">
            Fixmy<span className="text-slate-900">Flat</span>
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
            Sign up to report or manage apartment maintenance issues.
          </p>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Full name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Email id
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.rivera@oakridge.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              New Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Securepass123!"
                className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-1">
              Must be at least 4 characters
            </p>
          </div>

          {/* Re-enter Password */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Re-enter password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Securepass123!"
                className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Access Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <span>Access code</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <span className="text-[10px] font-extrabold tracking-wider text-blue-600 uppercase">
                AUTO-ROLE ASSIGNED
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold tracking-wider text-slate-900 placeholder-slate-400 placeholder:normal-case focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all uppercase"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-blue-500" />
              <span>Enter the access code you received.</span>
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer link to Login */}
      <div className="pt-6 pb-2 text-center text-xs text-slate-500">
        <span>Already have an account? </span>
        <Link to="/login" className="text-blue-600 font-bold hover:underline ml-1">
          Login
        </Link>
      </div>
    </div>
  );
};
