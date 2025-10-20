export const toIsoJst = (yyyyMmDd: string, hhmm: string): string => {
  // "2025-10-20", "09:00" -> "2025-10-20T09:00:00+09:00"
  return `${yyyyMmDd}T${hhmm}:00+09:00`;
};
