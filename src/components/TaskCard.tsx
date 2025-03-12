// src/app/components/TaskCard.tsx
"use client";

export default function TaskCard({
  task,
  details,
}: {
  task: string;
  details: { totalTime: number; count: number };
}) {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes.toFixed(0)} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes.toFixed(0)}min`;
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <h4 className="text-lg font-semibold text-gray-100 mb-2">{task}</h4>
      <div className="space-y-2">
        <p className="text-gray-300">
          <span className="font-medium">Tempo total:</span>{" "}
          {formatTime(details.totalTime)}
        </p>
        <p className="text-gray-300">
          <span className="font-medium">Realizado:</span> {details.count} vezes
        </p>
      </div>
    </div>
  );
}
