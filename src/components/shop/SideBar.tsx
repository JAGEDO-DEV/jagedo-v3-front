import { Checkbox } from "@/components/ui/checkbox";

interface SidebarProps {
  group: string;
  filters: string[];
  filterOptions: string[];
  onFilterChange: (filter: string, checked: boolean) => void;
}

const Sidebar = ({ group, filters, filterOptions, onFilterChange }: SidebarProps) => {
  const currentFilters = filterOptions;
  const groupTitle = group.toUpperCase();

  return (
    <div className="bg-white p-6 border-none min-h-screen">
      <div className="mb-6">
        <nav className="text-sm text-muted-foreground mb-2">
          <span>Home</span> <span className="mx-2">›</span>{" "}
          <span className="capitalize">
            {group === "hardware"
              ? "Hardware"
              : group === "custom"
              ? "Custom Products"
              : group}
          </span>
        </nav>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          {groupTitle}
        </h2>
        <div className="space-y-3">
          {currentFilters.map((filter) => (
            <div key={filter} className="flex items-center space-x-3">
              <Checkbox
                id={filter}
                checked={filters.some(f => f.trim().toLowerCase() === filter.trim().toLowerCase())}
                onCheckedChange={(checked) => onFilterChange(filter, !!checked)}
                className="data-[state=checked]:bg-blue-500 data-[state=checked]:text-white data-[state=checked]:border-blue-500"
              />
              <label
                htmlFor={filter}
                className="text-sm text-foreground cursor-pointer hover:text-blue-500 transition-colors"
              >
                {filter}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;