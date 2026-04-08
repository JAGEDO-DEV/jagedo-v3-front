/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronFirst,
  Users,
  Briefcase,
  Home,
  ShoppingCart,
  LayoutDashboard,
  Package,
  Eye,
  Tag,
  Settings,
  MapPin,
  User,
  Hammer,
  Banknote,
  ChevronDown,
  ChartNoAxesCombined,
  Mails,
  ShovelIcon,
  ShieldCheck,
} from "lucide-react";
import { useRolePermissions } from "@/context/RolePermissionProvider";
import { useGlobalContext } from "@/context/GlobalProvider";

const SidebarContext = createContext();

export const sidebarItems = [
  {
    title: "Overview",
    items: [
      {
        id: "home",
        title: "Home",
        icon: Home,
        href: "/dashboard/admin",
        color: "#2B7FFF",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        id: "user-management",
        title: "User Management",
        icon: Users,
        href: "/dashboard/admin/user-management",
        color: "#4A90E2",
      },
      {
        id: "bulk-sms",
        title: "Bulk SMS",
        icon: Mails,
        href: "/dashboard/admin/bulk-sms",
        color: "#00D153",
      },
      {
        id: "jobs",
        title: "Jobs",
        icon: Briefcase,
        href: "/dashboard/admin/jobs",
        color: "#BC68FF",
      },
      {
        id: "orders",
        title: "Orders",
        icon: ShoppingCart,
        href: "/dashboard/admin/orders",
        color: "#05CA55",
      },
      {
        id: "shop-app",
        title: "Shop App",
        icon: LayoutDashboard,
        color: "#F4C440",
        submenu: [
          {
            id: "shop-products",
            title: "Products",
            href: "/dashboard/admin/shop/products",
            icon: Package,
          },
          {
            id: "shop-customer-view",
            title: "Customer View",
            href: "/dashboard/admin/shop/customer-view",
            icon: Eye,
          },
          {
            id: "shop-groups",
            title: "Groups & SubGroups",
            href: "/dashboard/admin/shop/groups",
            icon: Tag,
          },
          {
            id: "shop-attributes",
            title: "Attributes",
            href: "/dashboard/admin/shop/attributes",
            icon: Settings,
          },
          {
            id: "shop-regions",
            title: "Regions",
            href: "/dashboard/admin/shop/regions",
            icon: MapPin,
          },
          {
            id: "shop-prices",
            title: "Prices",
            href: "/dashboard/admin/shop/prices",
            icon: Banknote,
          },
        ],
      },
      {
        id: "registers",
        title: "Registers",
        icon: Users,
        color: "#9B59B6",
        submenu: [
          {
            id: "registers-customers",
            title: "Customer Registers",
            href: "/dashboard/admin/customers",
            icon: User,
          },
          {
            id: "registers-builders",
            title: "Builder Registers",
            href: "/dashboard/admin/builders",
            icon: Hammer,
          },
        ],
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: ChartNoAxesCombined,
        href: "/dashboard/admin/analytics",
        color: "#FB3C47",
      },
      {
        id: "system-logs",
        title: "System Logs",
        icon: ShieldCheck,
        href: "/dashboard/admin/logs",
        color: "#10B981",
      },
      {
        title: "Configurations",
        icon: Settings,
        color: "#9B59B6",
        submenu: [
          {
            id: "configuration",
            title: "Builders Configurations",
            icon: ShovelIcon,
            href: "/dashboard/admin/configuration",
          },
        ],
      },
    ],
  },
];

export function AdminSidebar({ expanded, setExpanded }) {
  const location = useLocation();
  const { userMenuPermissions, isLoadingPermissions } = useRolePermissions();
  const { user } = useGlobalContext();

  
  const getAccessibleItems = () => {
    
    if (isLoadingPermissions) {
      return sidebarItems;
    }

    
    if (!userMenuPermissions || userMenuPermissions.length === 0) {
      return sidebarItems;
    }

    return sidebarItems
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            if (!item.submenu) {
              const hasAccess = userMenuPermissions.some(
                (perm) => perm.id === item.id,
              );
              return hasAccess ? item : null;
            }

            const filteredSubmenu = item.submenu.filter((subItem) =>
              userMenuPermissions.some((perm) => perm.id === subItem.id),
            );

            if (filteredSubmenu.length > 0) {
              return { ...item, submenu: filteredSubmenu };
            }

            return null;
          })
          .filter(Boolean),
      }))
      .filter((section) => section.items.length > 0);
  };

  const isActive = (href) => location.pathname === href;
  const isSubActive = (submenu) =>
    submenu?.some((sub) => location.pathname.startsWith(sub.href));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setExpanded]);

  
  useEffect(() => {
    getAccessibleItems(); 
    
  }, [userMenuPermissions, isLoadingPermissions]);

  const accessibleItems = getAccessibleItems();

  return (
    <>
      <div
        onClick={() => setExpanded(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-all duration-300 ease-in-out overflow-visible h-full flex flex-col ${
          expanded
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <nav className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div
            className={`p-5 mb-2 flex items-center transition-all ${
              expanded ? "justify-between" : "justify-center"
            }`}
          >
            <div
              className={`overflow-hidden transition-all duration-300 ${
                expanded ? "w-32 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <Link to="/dashboard/admin" className="block transform hover:scale-105 transition-transform">
                <img
                  src="/jagedologo.png"
                  alt="JAGEDO Logo"
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>
            <button
              onClick={() => setExpanded((curr) => !curr)}
              className="p-2 rounded-xl bg-gray-50/80 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100 flex items-center justify-center group"
            >
              <ChevronFirst 
                className={`w-5 h-5 transition-transform duration-500 ${!expanded ? "rotate-180" : ""}`} 
              />
            </button>
          </div>

          <SidebarContext.Provider value={{ expanded, setExpanded }}>
            <ul className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
              {accessibleItems.map((section, sectionIndex) => (
                <div key={sectionIndex} className="py-2">
                  {expanded && (
                    <li className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                      {section.title}
                    </li>
                  )}
                  {!expanded && sectionIndex > 0 && <div className="mx-4 my-4 h-[1px] bg-gray-100" />}
                  {section.items.map((item, itemIndex) => (
                    <SidebarItem
                      key={item.id || item.title + itemIndex}
                      icon={
                        <item.icon size={20} className="transition-colors group-hover:scale-110 duration-300" style={{ color: item.color }} />
                      }
                      text={item.title}
                      href={item.href}
                      submenu={item.submenu}
                      active={
                        item.href
                          ? isActive(item.href)
                          : isSubActive(item.submenu)
                      }
                    />
                  ))}
                </div>
              ))}
            </ul>
          </SidebarContext.Provider>

          {/* User Profile Section */}
          <div className="p-4 mt-auto border-t border-gray-50">
            <div className={`flex items-center gap-3 p-2 rounded-2xl transition-all ${expanded ? "bg-gray-50/80" : "justify-center"}`}>
              <div className="relative flex-shrink-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || "Admin")}&background=4f46e5&color=fff&bold=true`}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-white"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              
              {expanded && (
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-sm text-gray-800 truncate leading-none mb-1">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 truncate uppercase tracking-wider">
                    {user?.role || "ADMINISTRATOR"}
                  </p>
                </div>
              )}

              {!expanded && (
                <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all shadow-xl z-50 whitespace-nowrap">
                  {user?.firstName} {user?.lastName}
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

export function SidebarItem({ icon, text, href, active, submenu }) {
  const { expanded, setExpanded } = useContext(SidebarContext);
  const [open, setOpen] = useState(active);
  const itemRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const handleSubmenuClick = (e) => {
    e.preventDefault();
    if (!expanded) {
      setExpanded(true);
      setOpen(true);
    } else {
      setOpen((prev) => !prev);
    }
  };

  const itemContent = (
    <div
      onClick={submenu ? handleSubmenuClick : undefined}
      className={`relative flex items-center py-2.5 px-4 my-1 font-semibold rounded-xl cursor-pointer transition-all duration-200 group text-sm ${
        active
          ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <div className={`flex items-center justify-center transition-all duration-300 ${active ? "scale-110" : ""}`}>
        {icon}
      </div>
      
      <span
        className={`overflow-hidden transition-all duration-300 whitespace-nowrap font-medium ${
          expanded ? "w-44 ml-3.5 opacity-100" : "w-0 opacity-0"
        }`}
      >
        {text}
      </span>

      {expanded && submenu && (
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      )}

      {/* Tooltip for collapsed state */}
      {!expanded && (
        <div className="fixed left-20 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0 shadow-xl z-[100] pointer-events-none whitespace-nowrap">
          {text}
        </div>
      )}

      {/* Active Sidebar Indicator */}
      {active && !expanded && (
        <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
      )}
    </div>
  );

  return (
    <li className="relative px-1 group" ref={itemRef}>
      {href && !submenu ? (
        <Link to={href}>{itemContent}</Link>
      ) : (
        itemContent
      )}

      {open && expanded && submenu && (
        <ul className="mt-1 ml-4 pl-8 border-l border-gray-100 space-y-1 animate-in slide-in-from-top-1 duration-300">
          {submenu.map((subItem, index) => {
            const SubIcon = subItem.icon;
            const isSubActive = location.pathname === subItem.href;
            return (
              <li key={index}>
                <Link
                  to={subItem.href}
                  className={`flex items-center gap-3 rounded-lg py-2 px-3 text-[13px] font-medium transition-all ${
                    isSubActive
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {SubIcon && <SubIcon size={16} className={isSubActive ? "text-indigo-600" : "text-gray-400"} />}
                  <span>{subItem.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

