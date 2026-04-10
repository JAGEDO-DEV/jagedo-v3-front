import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface BarChartCardProps {
  title: string;
  description?: string;
  data: Record<string, any>[];
  bars: { key: string; color: string }[];
}

export default function BarChartCard({ title, description, data, bars }: BarChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="font-semibold text-foreground">{title}</h4>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      <div className="w-full h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#8884d8",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
            />
            {bars.map((bar) => (
              <Bar key={bar.key} dataKey={bar.key} fill="#8884d8" radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
