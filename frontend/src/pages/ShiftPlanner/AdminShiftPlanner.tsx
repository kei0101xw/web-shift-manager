import React, { useEffect, useMemo, useState } from "react";
import "./AdminShiftPlanner.css";
import { mockApi } from "../../mocks/mockApi";
import { useShiftPlan } from "./ShiftPlanContext";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

// ===== Helpers =====
const JST = "+09:00";

const ymdJST = (d: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const ymdFromISOJST = (iso: string) => ymdJST(new Date(iso));

const ymd = (d: Date) => ymdJST(d);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
function halfMonthRange(y: number, m: number, half: "H1" | "H2") {
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const s = new Date(y, m - 1, half === "H1" ? 1 : 16);
  const e = new Date(y, m - 1, half === "H1" ? 15 : last);
  return { start: s, end: e };
}
const toHM = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

// 同一時間帯（start/end一致）を合算
function aggregateByTime(list: Gap[]) {
  const map = new Map<
    string,
    { start_time: string; end_time: string; gap: number }
  >();
  for (const g of list) {
    const key = `${g.start_time}|${g.end_time}`;
    const cur = map.get(key) || {
      start_time: g.start_time,
      end_time: g.end_time,
      gap: 0,
    };
    cur.gap += g.gap;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );
}

// ===== Types =====
type Employee = { id: number; name: string; status: string };
type Avail = {
  id: number;
  employee_id: number;
  start_time: string;
  end_time: string;
};
type Gap = {
  start_time: string;
  end_time: string;
  role_id: number;
  capacity: number;
  assigned: number;
  gap: number;
};

// 役割（IDはバックエンドに合わせる）
const ROLES = [
  { id: 1, label: "キッチン" },
  { id: 2, label: "ホール" },
];

export default function AdminShiftPlanner() {
  const nav = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [half, setHalf] = useState<"H1" | "H2">("H1");
  const { start, end } = useMemo(
    () => halfMonthRange(year, month, half),
    [year, month, half]
  );
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1))
      arr.push(new Date(d));
    return arr;
  }, [start, end]);

  // ロール選択：必ずどちらか。初期はキッチン
  const [roleFilter, setRoleFilter] = useState<number>(1);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [serverMap, setServerMap] = useState<
    Record<number, Record<string, Avail[]>>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 不足情報
  const [gaps, setGaps] = useState<Gap[]>([]);
  const gapDetailsByDay = useMemo(() => {
    const map = new Map<string, Gap[]>();
    for (const g of gaps) {
      const key = ymdFromISOJST(g.start_time);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [gaps]);

  // コンテキスト：確定編集
  const { grid, setDecision } = useShiftPlan();

  // モーダル
  const [modal, setModal] = useState<{
    open: boolean;
    emp?: Employee;
    date?: Date;
    startHHMM: string;
    endHHMM: string;
    roleId: number;
    isOff: boolean;
  }>({
    open: false,
    startHHMM: "09:00",
    endHHMM: "18:00",
    roleId: 1,
    isOff: false,
  });

  // ロード（モック：従業員 & 希望）
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [emps, av] = await Promise.all([
          mockApi.listEmployees(),
          mockApi.listAvailability(
            `${ymdJST(start)}T00:00:00${JST}`,
            `${ymdJST(end)}T23:59:59${JST}`
          ),
        ]);
        const actives = emps.filter((e: Employee) => e.status === "active");
        setEmployees(actives);

        const map: Record<number, Record<string, Avail[]>> = {};
        for (const e of actives) {
          map[e.id] = {};
          for (const d of days) map[e.id][ymd(d)] = [];
        }
        for (const a of av) {
          const key = ymdFromISOJST(a.start_time);
          (map[a.employee_id] ||= {})[key] ||= [];
          map[a.employee_id][key].push(a);
        }
        setServerMap(map);
      } catch (e: any) {
        setError("ロードに失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [start, end, days.length]);

  // 不足情報（実APIを使用。失敗してもUIは継続）
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/gaps", {
          params: {
            from: `${ymdJST(start)}T00:00:00${JST}`,
            to: `${ymdJST(end)}T23:59:59${JST}`,
            role_id: roleFilter,
          },
        });
        setGaps(Array.isArray(data) ? data : []);
      } catch {
        setGaps([]);
      }
    })();
  }, [start, end, roleFilter]);

  const openEdit = (emp: Employee, date: Date) => {
    const key = ymd(date);
    const d = grid[emp.id]?.[key];
    let startHHMM = "09:00",
      endHHMM = "18:00",
      isOff = false,
      roleId = roleFilter; // 現在の選択ロールで初期化

    if (d?.type === "work") {
      startHHMM = d.start;
      endHHMM = d.end;
      roleId = d.role_id;
    } else if (d?.type === "off") {
      isOff = true;
    } else if (serverMap[emp.id]?.[key]?.[0]) {
      const s = new Date(serverMap[emp.id][key][0].start_time);
      const e = new Date(serverMap[emp.id][key][0].end_time);
      startHHMM = `${String(s.getHours()).padStart(2, "0")}:${String(
        s.getMinutes()
      ).padStart(2, "0")}`;
      endHHMM = `${String(e.getHours()).padStart(2, "0")}:${String(
        e.getMinutes()
      ).padStart(2, "0")}`;
    }

    setModal({
      open: true,
      emp,
      date,
      startHHMM,
      endHHMM,
      roleId,
      isOff,
    });
  };

  const applyEdit = () => {
    if (!modal.emp || !modal.date) return;
    const key = ymd(modal.date);
    if (modal.isOff) {
      setDecision(modal.emp.id, key, { type: "off" });
    } else {
      setDecision(modal.emp.id, key, {
        type: "work",
        start: modal.startHHMM,
        end: modal.endHHMM,
        role_id: roleFilter,
      });
    }
    setModal((m) => ({ ...m, open: false }));
  };

  function buildPlanSummary() {
    type Item = {
      date: string;
      employee_id: number;
      name: string;
      type: "work" | "off";
      start?: string;
      end?: string;
      role_id?: number;
    };
    const items: Item[] = [];
    for (const emp of employees) {
      const byDate = grid[emp.id] || {};
      for (const d of days) {
        const key = ymd(d);
        const dec = byDate[key];
        if (!dec) continue;
        if (dec.type === "off") {
          items.push({
            date: key,
            employee_id: emp.id,
            name: emp.name,
            type: "off",
          });
        } else if (dec.type === "work") {
          items.push({
            date: key,
            employee_id: emp.id,
            name: emp.name,
            type: "work",
            start: dec.start,
            end: dec.end,
            role_id: dec.role_id,
          });
        }
      }
    }
    return items;
  }

  async function handleCreate() {
    const items = buildPlanSummary();
    if (items.length === 0) {
      alert("作成対象がありません。セルを編集してから実行してください。");
      return;
    }

    const ok = window.confirm("シフトを確定してもよろしいですか？");
    if (!ok) return;

    // ---- ここは「モック」実行（後で実APIに差し替えやすいように）----
    try {
      // 例：バリデーションしたいときはここで /assignments/validate を呼ぶ想定
      // await api.post("/assignments/validate", { candidates: ... });

      // モック送信（演出）
      await new Promise((r) => setTimeout(r, 600));
      alert("シフトを作成しました。（モック）");
      nav("/managerhome");

      // 必要なら、送信後に画面をリセット or 再読込：
      // location.reload();
    } catch (e) {
      alert("作成に失敗しました。時間をおいて再度お試しください。");
    }
  }

  return (
    <div className="planner">
      <h1>シフト作成（管理者・編集）</h1>

      {/* 役割切替：キッチン／ホールのみ */}
      <div className="roleFilters">
        {ROLES.map((r) => (
          <button
            key={r.id}
            className={`chip ${roleFilter === r.id ? "on" : ""}`}
            onClick={() => setRoleFilter(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 期間コントロール */}
      <div className="controls">
        <label>
          年{" "}
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="num"
          />
        </label>
        <label>
          月{" "}
          <input
            type="number"
            value={month}
            min={1}
            max={12}
            onChange={(e) => setMonth(+e.target.value)}
            className="num"
          />
        </label>
        <label>
          半月{" "}
          <select
            value={half}
            onChange={(e) => setHalf(e.target.value as "H1" | "H2")}
          >
            <option value="H1">前半(1–15)</option>
            <option value="H2">後半(16–末)</option>
          </select>
        </label>
        <button className="primary" onClick={handleCreate}>
          + この内容でシフト作成 +{" "}
        </button>
      </div>

      {/* エラー */}
      {error && <p className="error">{error}</p>}

      {/* グリッド */}
      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <div className="gridWrapper">
          <table className="gridTable">
            <thead>
              <tr>
                <th className="stickyCol">従業員</th>
                {days.map((d) => {
                  const key = ymd(d);
                  const details = gapDetailsByDay.get(key) || [];
                  const tipRows = aggregateByTime(details);

                  return (
                    <th key={key} className="stickyHead">
                      {key.slice(5)}
                      {tipRows.length > 0 && (
                        <span className="gapBadge hasTip">
                          不足
                          <span className="tooltip">
                            <div className="tipTitle">時間帯 × 不足</div>
                            {tipRows.length === 0 ? (
                              <div className="tipEmpty">不足はありません</div>
                            ) : (
                              tipRows.map((g, i) => (
                                <div key={i} className="tipRow">
                                  <span className="tRange">
                                    {toHM(g.start_time)}–{toHM(g.end_time)}
                                  </span>
                                  <span className="tGap">不足 {g.gap}</span>
                                </div>
                              ))
                            )}
                          </span>
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <th className="stickyCol">{e.name}</th>
                  {days.map((d) => {
                    const key = ymd(d);
                    const dec = grid[e.id]?.[key];
                    const isOtherRole =
                      dec?.type === "work" && dec.role_id !== roleFilter;

                    let label = "";
                    let cls = "empty";

                    if (dec?.type === "off") {
                      label = "休";
                      cls = "off";
                    } else if (dec?.type === "work") {
                      if (!isOtherRole) {
                        label = `${dec.start}–${dec.end}`;
                        cls = "decided";
                      } else {
                        label = "";
                        cls = "empty"; // 他ロール確定は非表示
                      }
                    } else if (serverMap[e.id]?.[key]?.length) {
                      const s = new Date(serverMap[e.id][key][0].start_time);
                      const e2 = new Date(serverMap[e.id][key][0].end_time);
                      label = `${String(s.getHours()).padStart(
                        2,
                        "0"
                      )}:${String(s.getMinutes()).padStart(2, "0")}–${String(
                        e2.getHours()
                      ).padStart(2, "0")}:${String(e2.getMinutes()).padStart(
                        2,
                        "0"
                      )}`;
                      cls = "fromServer";
                    }

                    return (
                      <td
                        key={key}
                        className={`cell ${cls} ${isOtherRole ? "locked" : ""}`} // ★見た目ロック
                        onClick={isOtherRole ? undefined : () => openEdit(e, d)} // ★クリック無効
                        title={
                          isOtherRole
                            ? "別ロールで確定済み。ここでは編集できません。"
                            : "クリックして編集"
                        }
                      >
                        {label || <span className="placeholder">－</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 編集モーダル */}
      {modal.open && (
        <div
          className="modalOverlay"
          onClick={() => setModal((m) => ({ ...m, open: false }))}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modal.emp?.name} / {modal.date && ymd(modal.date)}
            </h3>

            <div className="modalRow">
              <label>
                <input
                  type="checkbox"
                  checked={modal.isOff}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, isOff: e.target.checked }))
                  }
                />{" "}
                休みにする
              </label>
            </div>

            {!modal.isOff && (
              <>
                <div className="modalRow">
                  <label>開始：</label>
                  <input
                    type="time"
                    value={modal.startHHMM}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, startHHMM: e.target.value }))
                    }
                  />
                </div>
                <div className="modalRow">
                  <label>終了：</label>
                  <input
                    type="time"
                    value={modal.endHHMM}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, endHHMM: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            <div className="modalActions">
              <button onClick={() => setModal((m) => ({ ...m, open: false }))}>
                キャンセル
              </button>
              <button className="primary" onClick={applyEdit}>
                適用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
