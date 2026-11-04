"use client";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// Categorical slots 1–2, validated against the navy surface (#111b3a): blue + orange.
export const C1 = "#3d8fdc";
export const C2 = "#d95926";
const AXIS = "#98a8cc";
const GRID = "#243461";

const tip = {
  contentStyle: { background: "#0a1128", border: "1px solid #6cabdd", borderRadius: 0, fontFamily: "var(--font-barlow)" },
  labelStyle: { color: "#f2f6fc", fontWeight: 600 },
  itemStyle: { color: "#f2f6fc" },
};

export interface Series {
  key: string;
  name: string;
  color?: string;
}

type Datum = Record<string, string | number | null>;

const fmt = (digits: number) => (v: unknown) => (typeof v === "number" ? v.toFixed(digits) : String(v ?? "–"));

export function GroupedBars({ data, x, series, height = 260, digits = 1 }: { data: Datum[]; x: string; series: Series[]; height?: number; digits?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={2} margin={{ left: -10, right: 8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={x} stroke={AXIS} tickLine={false} interval={0} tick={{ fontSize: 12 }} />
        <YAxis stroke={AXIS} tickLine={false} axisLine={false} />
        <Tooltip {...tip} cursor={{ fill: "rgba(108,171,221,0.08)" }} formatter={fmt(digits)} />
        {series.length > 1 && <Legend />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? (i ? C2 : C1)} radius={0} maxBarSize={32} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranking bar (single series). */
export function HBars({ data, label, value, name, height, digits = 0 }: { data: Datum[]; label: string; value: string; name: string; height?: number; digits?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(180, data.length * 28 + 20)}>
      <BarChart data={data} layout="vertical" margin={{ left: 30, right: 16 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" stroke={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey={label} stroke={AXIS} tickLine={false} width={110} interval={0} tick={{ fill: "#f2f6fc", fontSize: 12 }} />
        <Tooltip {...tip} cursor={{ fill: "rgba(108,171,221,0.08)" }} formatter={fmt(digits)} />
        <Bar dataKey={value} name={name} fill={C1} radius={0} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Trend({ data, x, series, height = 240, zero, digits = 1, domain, reversed, ticks }: {
  data: Datum[]; x: string; series: Series[]; height?: number; zero?: boolean; digits?: number;
  domain?: [number | string, number | string]; reversed?: boolean; ticks?: number[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -10, right: 12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={x} stroke={AXIS} tickLine={false} minTickGap={24} />
        <YAxis stroke={AXIS} tickLine={false} axisLine={false} domain={domain} reversed={reversed} ticks={ticks} allowDecimals={false} />
        {zero && <ReferenceLine y={0} stroke="#46568a" />}
        <Tooltip {...tip} formatter={fmt(digits)} />
        {series.length > 1 && <Legend />}
        {series.map((s, i) => (
          <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color ?? (i ? C2 : C1)} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: "#111b3a" }} activeDot={{ r: 6 }} connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Radar1({ data }: { data: { metric: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "#f2f6fc", fontSize: 12 }} />
        <Tooltip {...tip} formatter={(v) => `${Math.round(Number(v))}th percentile`} />
        <Radar dataKey="value" name="Percentile" stroke={C1} fill={C1} fillOpacity={0.35} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
