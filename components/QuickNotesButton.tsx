import React from 'react';
import { Bot } from 'lucide-react';

interface QuickNotesButtonProps {
  onToggle: () => void;
  isOpen: boolean;
}

const QuickNotesButton: React.FC<QuickNotesButtonProps> = ({ onToggle, isOpen }) => (
  <button
    onClick={onToggle}
    className={`fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 active:scale-95 ${
      isOpen
        ? 'bg-gray-600 hover:bg-gray-700'
        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
    }`}
    aria-label="AI Budget Agent"
    title="AI Budget Agent"
  >
    <Bot size={24} />
  </button>
);

export default QuickNotesButton;
