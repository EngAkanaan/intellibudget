import React, { useState } from 'react';
import { StickyNote } from 'lucide-react';
import QuickNotesModal from './QuickNotesModal';

interface QuickNotesButtonProps {
  onNoteAdded?: () => void;
}

const QuickNotesButton: React.FC<QuickNotesButtonProps> = ({ onNoteAdded }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Quick Notes"
        title="Quick Notes - Fast expense capture"
      >
        <StickyNote 
          size={24} 
          className="transition-transform group-hover:rotate-12" 
        />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
      </button>

      {/* Quick Notes Modal */}
      {isOpen && (
        <QuickNotesModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onNoteAdded={() => {
            setIsOpen(false);
            onNoteAdded?.();
          }}
        />
      )}
    </>
  );
};

export default QuickNotesButton;

