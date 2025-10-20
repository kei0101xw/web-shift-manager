import React, { createContext, useContext, useMemo, useState } from "react";

export type Decision =
  | { type: "off" }
  | { type: "work"; start: string; end: string; role_id: number };

export type Grid = Record<number, Record<string, Decision | undefined>>;
// eId -> { 'YYYY-MM-DD': Decision }

type Ctx = {
  grid: Grid;
  setDecision: (employeeId: number, ymd: string, decision?: Decision) => void;
  clearAll: () => void;
};

const ShiftPlanCtx = createContext<Ctx | null>(null);

export function ShiftPlanProvider({ children }: { children: React.ReactNode }) {
  const [grid, setGrid] = useState<Grid>({});

  const setDecision = (
    employeeId: number,
    ymd: string,
    decision?: Decision
  ) => {
    setGrid((prev) => {
      const row = { ...(prev[employeeId] || {}) };
      row[ymd] = decision;
      return { ...prev, [employeeId]: row };
    });
  };

  const clearAll = () => setGrid({});

  const value = useMemo(() => ({ grid, setDecision, clearAll }), [grid]);
  return (
    <ShiftPlanCtx.Provider value={value}>{children}</ShiftPlanCtx.Provider>
  );
}
export function useShiftPlan() {
  const v = useContext(ShiftPlanCtx);
  if (!v) throw new Error("ShiftPlanProvider is required");
  return v;
}
