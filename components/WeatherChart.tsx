import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WeatherChartProps {
  data: { time: string; temp: number; humidity: number }[];
  dataKey: "temp" | "humidity";
  color: string;
  unit: string;
}

export default function WeatherChart({ data, dataKey, color, unit }: WeatherChartProps) {
  const gradientId = dataKey === "temp" ? "tempGrad" : "humGrad";
  const label = dataKey === "temp" ? "Temp" : "Humidity";

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis 
          tick={{ fontSize: 11, fill: "#9ca3af" }} 
          axisLine={false} 
          tickLine={false} 
          domain={dataKey === "temp" ? [20, 40] : [40, 90]} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
          formatter={(v) => [`${v}${unit}`, label]}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
