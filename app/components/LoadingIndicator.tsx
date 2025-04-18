interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

export default function LoadingIndicator({ message = "Loading...", className = "" }: LoadingIndicatorProps) {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
