import React from 'react';

interface ToggleSwitchProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  compact?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, enabled, onChange, compact = false }) => {
  const labelClass = "text-sm font-medium";
  
  const switchButton = (
      <button
        onClick={() => onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
        className={`${
          enabled ? 'bg-accent' : 'bg-tertiary'
        } relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary btn-boop`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
  );

  if (compact) {
      return (
        <div className="flex items-center gap-3">
            <label className={`${labelClass} text-text-secondary`}>{label}</label>
            {switchButton}
        </div>
      );
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <label className={`${labelClass} text-text-primary block`}>{label}</label>
        {description && <p className="text-xs text-text-secondary opacity-70">{description}</p>}
      </div>
      {switchButton}
    </div>
  );
};

export default ToggleSwitch;