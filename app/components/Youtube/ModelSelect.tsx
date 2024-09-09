import { FC } from 'react';

interface ModelSelectProps {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}

export const ModelSelect: FC<ModelSelectProps> = ({
  label,
  value,
  options,
  onChange,
}) => (
  <div className="mb-4">
    <label className="block text-white mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
    >
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  </div>
);
