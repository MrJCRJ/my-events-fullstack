// src/app/types/types.ts
export interface Event {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export interface MonthlySummary {
  month: string;
  tasks: Record<string, { totalTime: number; count: number }>;
}
