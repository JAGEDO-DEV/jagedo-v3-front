import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PieItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieItem[];
  showLegend?: boolean;
}

export default function PieChartCard({ title, description, data, showLegend = true }: PieChartCardProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="font-semibold text-foreground">{title}</h4>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      <div className={`flex flex-row gap-2 justify-between ${showLegend ? 'px-16' : 'px-4'} mt-4`}>
        <div className={showLegend ? "w-72 h-62 ml-16" : "w-full h-64 flex justify-center"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {showLegend && (
          <div className="flex flex-col gap-3 justify-start">
            {data.map((item) => (
              <div key={item.name} className="flex items-center w-[400px] justify-between px-6 py-1 rounded-lg bg-gray-100 gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-foreground font-medium">{item.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {item.value} ({total ? ((item.value / total) * 100).toFixed(2) : 0}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
