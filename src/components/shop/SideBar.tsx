import { Checkbox } from "@/components/ui/checkbox";

interface SidebarProps {
  category: string;
  filters: string[];
  onFilterChange: (filter: string, checked: boolean) => void;
}

const filterOptions = {
  hardware: [
    "All Products",
    "Steel",
    "Quarry",
    "Concrete Tools & Equipment",
    "Timber",
    "Ceramics and Tiles",
    "Pipes and Fittings",
    "Aluminum",
    "Glass",
    "Roofing",
  ],
  custom: [
    "All Products",
    "Steel Windows",
    "Wooden Windows",
    "Wooden Doors",
    "Gates",
    "Gypsum Ceiling",
    "Steel Doors",
    "Bamboo Gates",
  ],
  equipment: [
    "All Products",
    "Earthmoving Equipment",
    "Trucks & Vehicles",
    "Concrete Equipment",
    "Compaction Equipment",
    "Lifting Equipment",
    "Demolition Equipment",
    "Safety Equipment",
    "Surveying Equipment",
    "Temporary Structures",
    "Power Tools",
  ],
  designs: [
    "All Products",
    "Mansionattes",
    "Bungalows",
    "Apartments",
    "Commercials",
    "Socials",
  ],
};

const Sidebar = ({ category, filters, onFilterChange }: SidebarProps) => {
  const currentFilters =
    filterOptions[category as keyof typeof filterOptions] || [];
  const categoryTitle = category.toUpperCase();

  return (
    <div className="bg-white p-6 border-none min-h-screen">
      <div className="mb-6">
        <nav className="text-sm text-muted-foreground mb-2">
          <span>Home</span> <span className="mx-2">›</span>{" "}
          <span className="capitalize">
            {category === "hardware"
              ? "Hardware"
              : category === "custom"
              ? "Custom Products"
              : category}
          </span>
        </nav>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          {categoryTitle}
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