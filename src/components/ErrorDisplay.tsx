// src/components/ErrorDisplay.tsx
export default function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">
      <p className="text-red-400">{error}</p>
    </div>
  );
}
