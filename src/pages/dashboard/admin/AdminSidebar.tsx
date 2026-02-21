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
            id: "shop-categories",
            title: "Categories",
            href: "/dashboard/admin/shop/categories",
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

  // Filter items based on user permissions
  const getAccessibleItems = () => {
    // While loading → show skeleton (or all items)
    if (isLoadingPermissions) {
      return sidebarItems;
    }

    // If no permissions returned → fallback to full menu (super admin case)
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

  // Log whenever permissions change
  useEffect(() => {
    getAccessibleItems(); // Recalculate accessible items when permissions change
    // Permissions updated
  }, [userMenuPermissions, isLoadingPermissions]);

  const accessibleItems = getAccessibleItems();

  return (
    <>
      <div
        onClick={() => setExpanded(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${
          expanded ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r shadow-lg z-50 transition-all duration-300 ease-in-out lg:relative lg:shadow-sm overflow-visible ${
          expanded
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <nav className="h-full flex flex-col">
          <div
            className={`p-4 pb-2 flex items-center ${
              expanded ? "justify-between" : "justify-center"
            }`}
          >
            <div
              className={`overflow-hidden transition-all ${
                expanded ? "w-40" : "w-0"
              }`}
            >
              <Link to="/dashboard/admin">
                <img
                  src="/jagedologo.png"
                  alt="JAGEDO Logo"
                  className="relative"
                />
              </Link>
            </div>
            <button
              onClick={() => setExpanded((curr) => !curr)}
              className="p-2 rounded-xl bg-white shadow-sm border hover:bg-gray-50 transition-all text-gray-600"
            >
              {expanded ? (
                <ChevronFirst className="w-5 h-5" />
              ) : (
                <ChevronFirst className="w-5 h-5 rotate-180" />
              )}
            </button>
          </div>

          <SidebarContext.Provider value={{ expanded, setExpanded }}>
            <ul className="flex-1 px-3 overflow-y-auto overflow-x-visible">
              {accessibleItems.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {expanded && (
                    <li className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </li>
                  )}
                  {!expanded && sectionIndex > 0 && <hr className="my-3" />}
                  {section.items.map((item, itemIndex) => (
                    <SidebarItem
                      key={item.id || item.title + itemIndex}
                      icon={
                        <item.icon size={20} style={{ color: item.color }} />
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

          <div className="border-t flex p-3 group relative">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName || "User")}&background=c7d2fe&color=3730a3&bold=true`}
              alt="User Avatar"
              className="w-10 h-10 rounded-md"
            />
            <div
              className={`flex justify-between items-center overflow-hidden transition-all ${
                expanded ? "w-52 ml-3" : "w-0"
              }`}
            >
              <div className="leading-4">
                <h4 className="font-semibold text-sm whitespace-nowrap">
                  {user?.firstName} {user?.lastName}
                </h4>
                <span className="text-xs text-gray-600">{user?.email}</span>
              </div>
            </div>
            {!expanded && (
              <div
                className={`fixed rounded-md px-3 py-2 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 transition-all z-50 group-hover:visible group-hover:opacity-100 whitespace-nowrap pointer-events-none`}
                style={{
                  left: "calc(5rem + 1.5rem)",
                  top: "calc(100vh - 5rem)",
                }}
              >
                <div className="font-semibold text-sm">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs">{user?.email}</div>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}

export function SidebarItem({ icon, text, href, active, submenu }) {
  const { expanded, setExpanded } = useContext(SidebarContext);
  const [open, setOpen] = useState(active);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const itemRef = useContext(SidebarContext) ? useRef(null) : null;
  const location = useLocation();

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const handleMouseEnter = () => {
    if (itemRef?.current && !expanded) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top,
        left: rect.right + 12,
      });
    }
  };

  const handleSubmenuClick = () => {
    if (!expanded) {
      setExpanded(true);
      setOpen(true);
    } else {
      setOpen((prev) => !prev);
    }
  };

  if (submenu) {
    return (
      <li
        ref={itemRef}
        onMouseEnter={handleMouseEnter}
        className={`rounded-md text-sm my-1 group relative ${
          active ? "bg-indigo-50 text-indigo-800" : "text-gray-600"
        }`}
      >
        <div
          onClick={handleSubmenuClick}
          className="relative flex items-center py-2 px-3 font-medium rounded-md cursor-pointer transition-colors hover:bg-indigo-50"
        >
          {icon}
          <span
            className={`overflow-hidden transition-all whitespace-nowrap ${
              expanded ? "w-52 ml-3" : "w-0"
            }`}
          >
            {text}
          </span>
          {expanded && (
            <ChevronDown
              size={15}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
        {!expanded && (
          <div
            className={`fixed rounded-md px-3 py-2 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 transition-all z-50 group-hover:visible group-hover:opacity-100 whitespace-nowrap pointer-events-none`}
            style={{
              left: `${tooltipPos.left}px`,
              top: `${tooltipPos.top}px`,
            }}
          >
            {text}
          </div>
        )}
        {open && expanded && (
          <ul className="pl-9 text-xs transition-all duration-300">
            {submenu.map((subItem, index) => {
              const SubIcon = subItem.icon;
              return (
                <li key={index} className="py-1">
                  <Link
                    to={subItem.href}
                    className={`flex items-center gap-2 rounded-md p-1 transition-colors whitespace-nowrap ${
                      location.pathname === subItem.href
                        ? "text-indigo-600 font-semibold"
                        : "text-gray-700 hover:text-indigo-600"
                    }`}
                  >
                    <SubIcon size={18} />
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

  return (
    <Link to={href}>
      <li
        ref={itemRef}
        onMouseEnter={handleMouseEnter}
        className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group text-sm ${
          active
            ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
            : "hover:bg-indigo-50 text-gray-600"
        }`}
      >
        {icon}
        <span
          className={`overflow-hidden transition-all whitespace-nowrap ${
            expanded ? "w-52 ml-3" : "w-0"
          }`}
        >
          {text}
        </span>
        {!expanded && (
          <div
            className={`fixed rounded-md px-3 py-2 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 transition-all z-50 group-hover:visible group-hover:opacity-100 whitespace-nowrap pointer-events-none`}
            style={{
              left: `${tooltipPos.left}px`,
              top: `${tooltipPos.top}px`,
            }}
          >
            {text}
          </div>
        )}
      </li>
    </Link>
  );
}
