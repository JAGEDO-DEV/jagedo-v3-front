import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface HorizontalBarChartCardProps {
  title: string;
  description?: string;
  data: Record<string, any>[];
  dataKey: string;
  color?: string;
}

export default function HorizontalBarChartCard({ 
  title, 
  description, 
  data, 
  dataKey,
  color = "#8884d8"
}: HorizontalBarChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="font-semibold text-foreground">{title}</h4>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      <div className="w-full h-40 mt-4">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart 
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: color,
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
