import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LineChartCardProps {
  title: string;
  description?: string;
  data: Record<string, any>[];
  lines: { key: string; color: string; name?: string; dashed?: boolean }[];
  xAxisKey?: string;
  children?: React.ReactNode;
}

export default function LineChartCard({ title, description, data, lines, xAxisKey = "date", children }: LineChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <h4 className="font-semibold text-foreground">{title}</h4>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {children}
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid hsl(var(--border))",
                borderRadius: 16,
                padding: "8px 12px",
              }}
              wrapperStyle={{
                outline: "none",
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name || line.key}
                stroke={line.color}
                strokeWidth={2}
                strokeDasharray={line.dashed ? "5 5" : undefined}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
