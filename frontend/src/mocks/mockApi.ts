// 超シンプルなモックAPI。localStorage に保存して擬似永続化。
// 本番切替時は import を ../../lib/api の実メソッドに差し替えればOK。

type Employee = { id: number; name: string; status: "active" | "inactive" };
type Availability = {
  id: number;
  employee_id: number;
  start_time: string; // ISO(+09:00)
  end_time: string; // ISO(+09:00)
  note?: string | null;
};

const LS_EMP = "mock_employees";
const LS_AVA = "mock_availability";
const LS_SEQ = "mock_seq";

function load<T>(k: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(k) || "") as T;
  } catch {
    return fallback;
  }
}
function save<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
}
function nextId() {
  const n = Number(localStorage.getItem(LS_SEQ) || "1");
  localStorage.setItem(LS_SEQ, String(n + 1));
  return n;
}

// 初期データ（必要なら好きに編集）
if (!localStorage.getItem(LS_EMP)) {
  save<Employee[]>(LS_EMP, [
    { id: 1, name: "山田 太郎", status: "active" },
    { id: 2, name: "佐藤 花子", status: "active" },
    { id: 3, name: "田中 一郎", status: "active" },
  ]);
}
if (!localStorage.getItem(LS_AVA)) {
  save<Availability[]>(LS_AVA, []);
}

function sleep(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockApi = {
  async listEmployees(): Promise<Employee[]> {
    await sleep();
    return load<Employee[]>(LS_EMP, []).filter((e) => e.status === "active");
  },
  async listAvailability(
    fromIso: string,
    toIso: string
  ): Promise<Availability[]> {
    await sleep();
    const all = load<Availability[]>(LS_AVA, []);
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    return all.filter((a) => {
      const s = new Date(a.start_time).getTime();
      const e = new Date(a.end_time).getTime();
      return s >= from && e <= to;
    });
  },
  async createAvailability(a: Omit<Availability, "id">): Promise<Availability> {
    await sleep();
    const all = load<Availability[]>(LS_AVA, []);
    const row = { ...a, id: nextId() };
    all.push(row);
    save(LS_AVA, all);
    return row;
  },
  async deleteAvailability(id: number): Promise<void> {
    await sleep();
    const all = load<Availability[]>(LS_AVA, []);
    save(
      LS_AVA,
      all.filter((x) => x.id !== id)
    );
  },

  // “シフト作成”のモック（ログ出力のみ）
  async createShiftsBulk(payload: any) {
    await sleep(500);
    console.log("[MOCK] createShiftsBulk", payload);
    return { created: payload?.items?.length || 0 };
  },
};
