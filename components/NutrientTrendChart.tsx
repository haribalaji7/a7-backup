import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface NutrientTrendChartProps {
  data: { month: string; N: number; P: number; K: number; Mo: number }[];
}

export default function NutrientTrendChart({ data }: NutrientTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="nGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
        <Area type="monotone" dataKey="N" stroke="#22c55e" strokeWidth={2} fill="url(#nGrad)" dot={false} />
        <Area type="monotone" dataKey="P" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} />
        <Area type="monotone" dataKey="K" stroke="#f59e0b" strokeWidth={2} fill="none" dot={false} />
        <Area type="monotone" dataKey="Mo" stroke="#8b5cf6" strokeWidth={2} fill="none" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
