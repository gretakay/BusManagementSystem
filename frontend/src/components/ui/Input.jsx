import { forwardRef } from 'react';

export const Input = forwardRef(({ 
  className = '', 
  type = 'text',
  label,
  error,
  helper,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-3 py-2.5 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
          placeholder-gray-400 text-gray-900
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

export const TextArea = forwardRef(({ 
  className = '', 
  label,
  error,
  helper,
  rows = 3,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3 py-2.5 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
          placeholder-gray-400 text-gray-900 resize-vertical
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(({ 
  className = '', 
  label,
  error,
  helper,
  options = [],
  placeholder = '請選擇...',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2.5 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
          text-gray-900 bg-white
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});