import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  subtitle?: string;
}

export default function StatCard({ title, value, change, changeType = "neutral", icon: Icon, subtitle }: StatCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-chart-green"
      : changeType === "negative"
      ? "text-chart-red"
      : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-sm text-chart-green mt-1">{subtitle}</p>}
        {change && (
          <p className={`text-xs mt-1 ${changeColor}`}>
            <span className="inline-block mr-1">{changeType === "negative" ? <TrendingDown color="red" size={16}/> : <TrendingUp color="green" size={16}/>}</span>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
