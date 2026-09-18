import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../lib/dataService';
import { 
  ChevronLeft, 
  MapPin, 
  UploadCloud, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Carpentry',
  'HVAC / Air Conditioning',
  'Elevator / Lift',
  'Structural / Walls',
  'Appliance',
  'Other'
];

export const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(user?.apartment_id || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('Photo size exceeds 10MB limit. Please choose a smaller image.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Validation
    if (!description.trim()) {
      setError('Please provide a description of the issue.');
      return;
    }
    if (!location.trim()) {
      setError('Please specify the location (e.g. Apt 4B, Kitchen).');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;

      if (photoFile) {
        setUploadProgress('Uploading photo...');
        try {
          uploadedUrl = await DataService.uploadPhoto(photoFile);
        } catch (uploadErr) {
          console.error('Photo upload error', uploadErr);
          const proceed = window.confirm(
            'Photo upload encountered an issue. Would you like to submit your maintenance request without the photo?'
          );
          if (!proceed) {
            setSubmitting(false);
            setUploadProgress(null);
            return;
          }
        }
      }

      setUploadProgress('Creating maintenance request...');
      const created = await DataService.createIssue({
        resident_id: user?.id || 'anonymous',
        resident_name: user?.name || 'Resident',
        title: title.trim() || (category ? `${category} issue` : 'Apartment Maintenance'),
        category: category || 'General',
        description: description.trim(),
        location: location.trim(),
        photo_url: uploadedUrl,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/resident/issues/${created.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <div className="relative flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => navigate('/resident')}
          className="flex items-center gap-1 text-slate-800 hover:text-blue-600 transition-colors text-sm font-bold"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          <span>Back</span>
        </button>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
          Report an Issue
        </h1>
        <div className="w-12" /> {/* Balancing placeholder */}
      </div>

      <main className="flex-1 px-5 py-5 overflow-y-auto">
        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Feedback */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">Issue submitted successfully! Loading details...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all cursor-pointer"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Issue title */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Issue title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water leakage"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all resize-none"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Apt 4B, Kitchen"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Attach Photo (Optional) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1.5">
              <span>Attach photo</span>
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/png,image/jpeg,image/webp,image/heic"
              className="hidden"
            />

            {!photoPreview ? (
              /* Upload Dropzone matching Figma dashed box */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100/60 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Tap to upload or take a photo
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, HEIC up to 10MB
                </p>
              </div>
            ) : (
              /* Photo Preview with Remove action */
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 p-2 bg-slate-50 flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Upload preview"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {photoFile?.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 pb-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-150"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress || 'Submitting...'}</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
