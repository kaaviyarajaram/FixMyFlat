import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 truncate">{title || 'Attached Photo'}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-black flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={title || 'Attachment'}
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        </div>

        <div className="p-3 text-center bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500">Tap anywhere outside to close</p>
        </div>
      </div>
    </div>
  );
};
