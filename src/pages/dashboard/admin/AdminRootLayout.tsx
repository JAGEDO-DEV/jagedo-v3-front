/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Menu, UserCircle, Lock } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getNotifications } from "@/api/notifications.api";
import { NotificationsModal } from "@/components/NotificationsModal";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { toast } from "react-hot-toast";
import { getProviderProfile } from "@/api/provider.api";

export default function AdminRootLayout() {
  const navigate = useNavigate();
  const { user, logout } = useGlobalContext();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  
  const [isSidebarExpanded, setSidebarExpanded] = useState(window.innerWidth > 1024);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notificationsPopoverOpen, setNotificationsPopoverOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const resolveProfileImageSrc = (src?: string | null) => {
    if (!src) return null;
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    const base = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
    return `${base}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications(axiosInstance);
        const notificationData = response.hashSet || response.data;

        if (response.success && Array.isArray(notificationData)) {
          const transformedNotifications = notificationData.map((apiNotif: any) => {
            let title = "Notification";
            let text = apiNotif.message;
            try {
              const parsed = JSON.parse(apiNotif.message);
              if (typeof parsed === 'object' && parsed !== null) {
                title = parsed.title || title;
                text = parsed.text || text;
              }
            } catch (e) {
              
              if (text.includes("Signup")) title = "New User Signup";
              else if (text.includes("profile")) title = "Profile Update";
              else if (text.includes("approved")) title = "Account Approved";
            }
            return {
              id: apiNotif.id, title, message: text,
              time: new Date(apiNotif.date).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
              }),
              read: false, originalItem: apiNotif.originalItem,
            };
          }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

          setNotifications(transformedNotifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast.error("Could not load notifications.");
      }
    };
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        if (!user?.id) return;
        const profile = await getProviderProfile(axiosInstance, user.id);
        
        const img = profile?.data?.profileImage || profile?.profileImage || null;
        setProfileImage(img);
      } catch (error) {
        
      }
    };
    fetchProfileImage();
  }, [axiosInstance, user?.id]);

  const handleMarkAsRead = (notificationId: string | number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const handleNotificationClick = (notification: any) => {
    handleMarkAsRead(notification.id);
    toast.info(`Navigating to details for: ${notification.title}`);
    setNotificationsPopoverOpen(false);
  };

  const handleViewAllNotifications = () => {
    setNotificationsPopoverOpen(false);
    setNotificationsModalOpen(true);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <TooltipProvider>
      <div className="relative min-h-screen lg:flex bg-gray-50/50">
        {/* Mobile Sidebar Toggle - Hidden on Large Screens */}
        {!isSidebarExpanded && (
          <button
            onClick={() => setSidebarExpanded(true)}
            className="fixed top-4 left-4 z-[60] lg:hidden p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        )}

        <AdminSidebar
          expanded={isSidebarExpanded}
          setExpanded={setSidebarExpanded}
        />

        {/* Main Content Area */}
        <div 
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isSidebarExpanded ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          {/* Header */}
          <header className="sticky top-0 z-30 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex h-16 items-center justify-between px-4 sm:px-8">
                {/* Logo for mobile only */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Link to="/dashboard/admin" className="flex items-center gap-2 group">
                        <img 
                          src="/jagedologo.png" 
                          alt="JAGEDO Logo" 
                          width={120} 
                          height={32} 
                          className="relative transition-transform group-hover:scale-105" 
                        />
                    </Link>
                </div>

                {/* Dashboard Title / Breadcrumb (Desktop) */}
                <div className="hidden lg:flex items-center gap-4">
                  <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Admin Dashboard</h1>
                </div>

                <div className="flex-1"></div>

                {/* Header Actions */}
                <nav className="flex items-center gap-2 sm:gap-4">
                  <Popover open={notificationsPopoverOpen} onOpenChange={setNotificationsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <Bell className="h-[22px] w-[22px] text-gray-600" />
                        {unreadCount > 0 && (
                          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 sm:w-96 p-0 mt-2 shadow-2xl rounded-2xl border-gray-100" align="end">
                      <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                        <h3 className="font-semibold text-gray-800">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center">
                            <div className="bg-gray-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                              <Bell className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No new notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((notification) => (
                            <div 
                              key={notification.id} 
                              onClick={() => handleNotificationClick(notification)} 
                              className={`p-4 border-b last:border-0 hover:bg-gray-50/80 transition-colors cursor-pointer group ${!notification.read ? "bg-indigo-50/40" : ""}`}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1">
                                  <h4 className={`font-semibold text-sm ${!notification.read ? "text-indigo-900" : "text-gray-800"}`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">{notification.message}</p>
                                  <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-2">
                                    <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                                    {notification.time}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-indigo-500 rounded-full mt-1.5 ring-4 ring-indigo-50"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t bg-white rounded-b-2xl">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold" 
                          onClick={handleViewAllNotifications}
                        >
                          View all activity
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="group flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-100 transition-all focus:outline-none"
                      >
                        <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm group-hover:border-indigo-100 transition-all">
                          <img
                            src={resolveProfileImageSrc(profileImage) || "/images/customer-1.jpeg"}
                            alt="User avatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="hidden sm:flex flex-col items-start pr-1">
                          <span className="text-sm font-bold text-gray-800 leading-none">
                            {user?.firstName || "Admin"}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">
                            {user?.role || "Administrator"}
                          </span>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5 shadow-2xl rounded-2xl border-gray-100">
                      <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Account Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="mx-1.5 bg-gray-100" />
                      <DropdownMenuItem 
                        className="rounded-lg cursor-pointer px-3 py-2 text-sm font-medium focus:bg-indigo-50 focus:text-indigo-700" 
                        onClick={() => navigate("/profile")}
                      >
                        <UserCircle className="mr-2.5 h-4.5 w-4.5 opacity-70" />
                        <span>My Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-lg cursor-pointer px-3 py-2 text-sm font-medium focus:bg-indigo-50 focus:text-indigo-700" 
                        onClick={() => setIsChangePasswordOpen(true)}
                      >
                        <Lock className="mr-2.5 h-4.5 w-4.5 opacity-70" />
                        <span>Security Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="mx-1.5 bg-gray-100" />
                      <DropdownMenuItem 
                        className="rounded-lg cursor-pointer px-3 py-2 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors" 
                        onClick={logout}
                      >
                        <LogOut className="mr-2.5 h-4.5 w-4.5 opacity-70" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </nav>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 overflow-x-hidden bg-transparent">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Outlet />
              </div>
            </div>
          </main>
        </div>

        {/* Modals & Dialogs */}
        <NotificationsModal 
          isOpen={notificationsModalOpen} 
          onClose={() => setNotificationsModalOpen(false)} 
          notifications={notifications} 
          onNotificationClick={handleNotificationClick} 
          onMarkAsRead={handleMarkAsRead} 
          onMarkAllAsRead={handleMarkAllAsRead} 
        />

        <ChangePasswordDialog
          isOpen={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
          onSuccess={() => {
            setIsChangePasswordOpen(false);
          }}
        />
      </div>
    </TooltipProvider>

  );
}