"use client";
import { useState, type ReactNode } from "react";
import { useFilters, useSeasons, type Venue } from "@/lib/data";

export function Card({ title, children, note }: { title?: string; children: ReactNode; note?: string }) {
  return (
    <section className="border border-line border-l-4 border-l-sky bg-surface p-4">
      {title && <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-wide">{title}</h2>}
      {children}
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </section>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="border border-line bg-surface px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="font-display text-4xl font-bold leading-tight text-white">{value}</div>
      {sub && <div className="text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="uppercase tracking-wider text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-line bg-background px-2 py-1 font-medium">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ venue = true }: { venue?: boolean }) {
  const f = useFilters();
  const { data: seasons } = useSeasons();
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-line bg-surface px-4 py-2">
      <Select label="Season" value={f.season} options={["All", ...(seasons?.map((s) => s.season) ?? [])]} onChange={f.setSeason} />
      {venue && <Select label="Venue" value={f.venue} options={["All", "Home", "Away"]} onChange={(v) => f.setVenue(v as Venue)} />}
    </div>
  );
}

export function Loading({ error }: { error?: string | null }) {
  return <p className="py-12 text-center text-muted">{error ? `Error: ${error}` : "Loading…"}</p>;
}

const chip = { W: "bg-[#3d8fdc] text-white", D: "bg-[#5a6a94] text-white", L: "bg-[#d95926] text-white" } as const;
export function ResultChip({ result, className = "" }: { result: "W" | "D" | "L"; className?: string }) {
  return <span className={`inline-flex h-7 w-7 items-center justify-center text-xs font-bold ${chip[result]} ${className}`}>{result}</span>;
}

export interface Col<T> {
  key: string;
  header: string;
  value: (r: T) => number | string;
  render?: (r: T) => ReactNode;
  align?: "left" | "right";
}

/** Small sortable table. */
export function DataTable<T>({ rows, cols, initialSort, rowKey, initialDir = -1, maxHeight }: {
  rows: T[]; cols: Col<T>[]; initialSort: string; rowKey: (r: T) => string | number; initialDir?: 1 | -1; maxHeight?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: initialSort, dir: initialDir });
  const col = cols.find((c) => c.key === sort.key) ?? cols[0];
  const sorted = [...rows].sort((a, b) => {
    const x = col.value(a);
    const y = col.value(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
  });
  return (
    <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            {cols.map((c) => (
              <th
                key={c.key}
                className={`cursor-pointer select-none px-2 py-2 ${c.align === "left" ? "text-left" : "text-right"} hover:text-sky`}
                onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (-s.dir as 1 | -1) : -1 }))}
                aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
              >
                {c.header}
                {sort.key === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} className="border-b border-line/50 hover:bg-white/5">
              {cols.map((c) => (
                <td key={c.key} className={`px-2 py-1.5 tabular-nums ${c.align === "left" ? "text-left" : "text-right"}`}>
                  {c.render ? c.render(r) : c.value(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
