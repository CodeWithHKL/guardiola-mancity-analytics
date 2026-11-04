"use client";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, LabelList, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// Categorical slots 1–2, validated against the navy surface (#0e2450): blue + orange.
export const C1 = "#4499e6";
export const C2 = "#e8672f";
const AXIS = "#b3c8ec";
const GRID = "#2f4f8c";

const tip = {
  contentStyle: { background: "#0e2450", border: "1px solid #8fcaf5", borderRadius: 0, fontFamily: "var(--font-barlow)" },
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
        {zero && <ReferenceLine y={0} stroke="#5b78b4" />}
        <Tooltip {...tip} formatter={fmt(digits)} />
        {series.length > 1 && <Legend />}
        {series.map((s, i) => (
          <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color ?? (i ? C2 : C1)} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: "#0e2450" }} activeDot={{ r: 6 }} connectNulls />
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

export const NEUTRAL = "#5b78b4";

export interface SeasonPoint {
  season: string;
  points: number;
  finish: string;
  champion: boolean;
}

/** Points per season: title-winning seasons in blue, the rest neutral. The selected season gets a white outline. */
export function SeasonPoints({ data, selected, height = 300 }: { data: SeasonPoint[]; selected?: string | null; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, left: -10, right: 8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="season" stroke={AXIS} tickLine={false} interval={0} tick={{ fontSize: 12 }} />
        <YAxis stroke={AXIS} tickLine={false} axisLine={false} domain={[0, 110]} ticks={[0, 25, 50, 75, 100]} />
        <Tooltip {...tip} cursor={{ fill: "rgba(143,202,245,0.08)" }} formatter={(v, _n, item) => [`${v} pts`, `Finished ${(item.payload as SeasonPoint).finish}`]} />
        <Bar dataKey="points" name="Points" maxBarSize={48}>
          {data.map((d) => (
            <Cell key={d.season} fill={d.champion ? C1 : NEUTRAL} stroke={selected === d.season ? "#ffffff" : "none"} strokeWidth={2} />
          ))}
          <LabelList dataKey="points" position="top" fill="#f2f6fc" fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
