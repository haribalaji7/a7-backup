import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface HealthTrendChartProps {
  data: { week: string; Field_A: number; Field_B: number; Field_C: number }[];
}

export default function HealthTrendChart({ data }: HealthTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[40, 100]} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Field_A" name="Field A" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} />
        <Line type="monotone" dataKey="Field_B" name="Field B" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} />
        <Line type="monotone" dataKey="Field_C" name="Field C" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
