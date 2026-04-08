import { cn } from "@/lib/utils";

interface GroupTabsProps {
  activeGroup: string;
  onGroupChange: (group: string) => void;
}

const groups = [
  { id: "hardware", label: "Hardware" },
  { id: "custom", label: "Custom Products" },
  { id: "equipment", label: "Hire Equipments & Machinery" },
  { id: "designs", label: "Designs" },
];

const GroupTabs = ({ activeGroup, onGroupChange }: GroupTabsProps) => {
  return (
    <div className={cn(
      "flex flex-col w-full space-y-1 p-1 mt-6 rounded-xl bg-[#F2F4F7] border border-gray-200/50",
      "md:flex-row md:w-full md:space-y-0 md:space-x-1"
    )}>
      {groups.map((group) => {
        const isActive = activeGroup === group.id;
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onGroupChange(group.id)}
            className={cn(
              "w-full justify-center px-6 py-3 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap",
              isActive
                ? "bg-[#000080] text-white shadow-md"
                : "bg-transparent text-[#2563EB] hover:bg-gray-200/60",
              "md:flex-1"
            )}
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );
};

export default GroupTabs;