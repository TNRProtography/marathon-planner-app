
import React, { useEffect } from 'react';
import ActivityForm from './ActivityForm';
import { Activity } from '../types';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveActivity: (activity: Activity | Omit<Activity, 'id'>) => void;
  initialDate: Date | null;
  activityToEdit: Activity | null;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveActivity, 
  initialDate,
  activityToEdit 
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 modal-content overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-sky-400">
            {activityToEdit ? 'Edit Activity' : 'Add New Activity'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ActivityForm 
          onSave={onSaveActivity} 
          onCancel={onClose} 
          initialDate={initialDate}
          activityToEdit={activityToEdit}
        />
      </div>
    </div>
  );
};

export default ActivityModal;
