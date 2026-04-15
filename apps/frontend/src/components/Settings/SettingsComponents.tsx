import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-heading">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  description?: string;
}

export function SliderSetting({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  description,
}: SliderSettingProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-heading">{label}</label>
        <span className="text-sm text-muted">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-border-light dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      {description && (
        <p className="text-xs text-muted">{description}</p>
      )}
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleSettingProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-heading">{label}</label>
        {description && (
          <p className="mt-1 text-xs text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          checked
            ? 'bg-primary'
            : 'bg-border-light dark:bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectSettingProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  description?: string;
  disabled?: boolean;
}

export function SelectSetting({
  label,
  value,
  options,
  onChange,
  description,
  disabled = false,
}: SelectSettingProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-heading">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 cursor-pointer ${
          disabled
            ? 'bg-border-light dark:bg-gray-800 text-muted cursor-not-allowed border-border dark:border-gray-700'
            : 'bg-surface dark:bg-gray-800 text-heading border-border dark:border-gray-600 hover:border-primary-light'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="text-xs text-muted">{description}</p>
      )}
    </div>
  );
}

interface SettingItemProps {
  children: ReactNode;
  className?: string;
}

export function SettingItem({ children, className = '' }: SettingItemProps) {
  return (
    <div
      className={`p-4 bg-surface dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}
