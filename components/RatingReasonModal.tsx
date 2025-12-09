import React, { useState } from 'react';
import { XIcon } from './icons';

interface RatingReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reasons: string[], comment: string }) => void;
  rating: number;
}

const RATING_REASONS: Record<number, string[]> = {
  1: ["Out of Character", "Repetitive", "Boring", "Doesn't make sense", "Bad grammar"],
  2: ["Too short", "Too verbose", "Missed the point", "Poor pacing"],
  3: ["It's fine", "A bit generic", "Good, but could be better"],
  4: ["Creative", "Good description", "In character", "Moved the story forward"],
  5: ["Perfect!", "Exactly what I wanted", "Incredibly immersive", "Wow!"],
};

const RatingReasonModal: React.FC<RatingReasonModalProps> = ({ isOpen, onClose, onSubmit, rating }) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  if (!isOpen || !rating) return null;

  const reasons = RATING_REASONS[rating] || [];

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = () => {
    onSubmit({ reasons: selectedReasons, comment: comment.trim() });
    // Reset state for next use
    setSelectedReasons([]);
    setComment('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl p-6 w-full max-w-md m-4 border border-accent flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-accent">Why did you rate it {rating} star{rating > 1 ? 's' : ''}?</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><XIcon /></button>
        </div>
        
        {reasons.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-text-secondary mb-2">Select any that apply (optional):</p>
            <div className="flex flex-wrap gap-2">
              {reasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => handleReasonToggle(reason)}
                  className={`py-1 px-3 text-sm rounded-full border transition-colors ${
                    selectedReasons.includes(reason)
                      ? 'bg-accent text-primary border-accent'
                      : 'bg-tertiary text-text-primary border-tertiary hover:border-accent'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="rating-comment" className="text-sm text-text-secondary mb-1 block">Add a comment (optional):</label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-tertiary border border-tertiary rounded-md p-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            rows={3}
            placeholder="Your feedback helps the AI learn..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary">Cancel</button>
          <button onClick={handleSubmit} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover">Submit Feedback</button>
        </div>
      </div>
    </div>
  );
};

export default RatingReasonModal;