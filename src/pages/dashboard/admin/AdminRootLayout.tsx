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
        // getProviderProfile returns response.data
        const img = profile?.data?.profileImage || profile?.profileImage || null;
        setProfileImage(img);
      } catch (error) {
        // keep silent; we'll fall back to default avatar
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
      <div className="relative min-h-screen lg:flex bg-gray-50">
        <button
          onClick={() => setSidebarExpanded(true)}
          className="fixed top-4 left-4 z-[60] lg:hidden p-2 bg-white rounded-md shadow-md border"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>

        <AdminSidebar
          expanded={isSidebarExpanded}
          setExpanded={setSidebarExpanded}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out lg:ml-20`}>
          <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md shadow-sm border-b">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-2 lg:hidden">
                    <Link to="/dashboard/admin" className="flex items-center gap-2">
                        <img src="/jagedologo.png" alt="JAGEDO Logo" width={150} height={40} className="relative rounded-lg" />
                    </Link>
                </div>

                <div className="flex-1"></div>

                <nav className="flex items-center space-x-2 sm:space-x-4">
                  <Popover open={notificationsPopoverOpen} onOpenChange={setNotificationsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-4 border-b">
                        <h3 className="font-medium flex justify-between items-center">
                          Notifications {unreadCount > 0 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{unreadCount} new</span>}
                        </h3>
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-500">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div key={notification.id} onClick={() => handleNotificationClick(notification)} className={`p-4 border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50" : ""}`}>
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                {!notification.read && <span className="h-2 w-2 bg-blue-500 rounded-full"></span>}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full" onClick={handleViewAllNotifications}>View all notifications</Button></div>
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="relative h-8 w-8 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a63e]"
                      >
                        <img
                          src={resolveProfileImageSrc(profileImage) || "/images/customer-1.jpeg"}
                          alt="User avatar"
                          width={32}
                          height={32}
                          className="h-full w-full rounded-full object-cover border"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}><UserCircle className="mr-2 h-4 w-4" /><span>My Profile</span></DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => setIsChangePasswordOpen(true)}><Lock className="mr-2 h-4 w-4" /><span>Change Password</span></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </nav>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
                <Outlet />
          
            </div>
          </main>
        </div>

        <NotificationsModal isOpen={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} notifications={notifications} onNotificationClick={handleNotificationClick} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} />

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