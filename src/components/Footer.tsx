import React from 'react';
import { HelpCircle, Info, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenWhyModal?: () => void;
  onOpenDemoInfoModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenWhyModal, onOpenDemoInfoModal }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-tight text-sm">
              NextGen EPFO
            </span>
            <span className="bg-slate-800 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700">
              e-Sewa 3.0
            </span>
          </div>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-amber-400 font-medium text-[11px]">
            Hackathon prototype. Synthetic data only.
          </span>
        </div>

        {/* Modal Links & Powered by OpenAI Branding */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-[11px]">
          {onOpenWhyModal && (
            <button
              onClick={onOpenWhyModal}
              className="text-slate-300 hover:text-white underline underline-offset-4 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none rounded px-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why this prototype?</span>
            </button>
          )}

          {onOpenDemoInfoModal && (
            <button
              onClick={onOpenDemoInfoModal}
              className="text-slate-300 hover:text-white underline underline-offset-4 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none rounded px-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Demo Info</span>
            </button>
          )}

          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="text-slate-500">Not affiliated with EPFO or Govt. of India</span>

          {/* Powered by OpenAI badge at the edge */}
          <div className="inline-flex items-center gap-1.5 bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-800 font-medium text-[11px] shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Powered by OpenAI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

