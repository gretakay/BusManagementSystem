export const Card = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-4 py-3 border-b border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-4 py-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-4 py-3 border-t border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};