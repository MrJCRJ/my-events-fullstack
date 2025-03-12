// src/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">
      <div className="border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
    </div>
  );
}
