// src/app/components/MonthlySummarySection.tsx
"use client";

import TaskCard from "./TaskCard";
import { MonthlySummary } from "@/app/types/types";

export default function MonthlySummarySection({
  summary,
}: {
  summary: MonthlySummary[];
}) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Resumo Mensal</h2>
      {summary.map((monthSummary) => (
        <div
          key={monthSummary.month}
          className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6"
        >
          <h3 className="text-xl font-semibold text-gray-200 mb-4">
            Mês: {monthSummary.month}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(monthSummary.tasks).map(([task, details]) => (
              <TaskCard key={task} task={task} details={details} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
