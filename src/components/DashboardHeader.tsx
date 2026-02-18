/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CubeTransparentIcon, UserCircleIcon, Bars3Icon, BellIcon, ShoppingCartIcon,
  DocumentIcon, QuestionMarkCircleIcon, BriefcaseIcon, ArrowRightOnRectangleIcon
} from "@heroicons/react/24/solid";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";
import { getProviderProfile } from "@/api/provider.api";
import { useCart } from "@/context/CartContext";
import { getNotifications } from "@/api/notifications.api";
import { toast } from "react-hot-toast";
import { NotificationsModal } from "@/components/NotificationsModal";

const Avatar = ({ src, alt, className = "h-10 w-10" }: { src: string; alt: string; className?: string }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} rounded-full object-cover border border-gray-200`}
    />
  );
};

const NavComponent = ({ notifications, unreadCount, onNotificationClick, onViewAllNotifications }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-gray-100/80 transition-all duration-200 hover:scale-105"
        >
          <BellIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium animate-pulse shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white shadow-xl border-0 animate-in slide-in-from-top-2 duration-200" align="end">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BellIcon className="h-4 w-4 text-blue-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {unreadCount} new
              </span>
            )}
          </h3>
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
                className={`p-4 border-b last:border-0 hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${!notification.read ? "bg-blue-50/50 border-l-4 border-l-blue-400" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-gray-800 group-hover:text-gray-900 transition-colors">
                    {notification.title}
                  </h4>
                  {!notification.read && <span className="h-2 w-2 bg-blue-500 rounded-full shadow-sm"></span>}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full hover:bg-white transition-colors duration-200 font-medium"
              onClick={() => {
                setIsPopoverOpen(false);
                onViewAllNotifications();
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

const CustomerNav = ({ totalItems, notifications, unreadCount, onNotificationClick, onViewAllNotifications, isGuest }) => {
  return (
    <div className="flex items-center gap-1">
      {!isGuest && <NavComponent notifications={notifications} unreadCount={unreadCount} onNotificationClick={onNotificationClick} onViewAllNotifications={onViewAllNotifications} />}
      <Link to="/customer/cart" className="group">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-green-50 transition-all duration-200 hover:scale-105 group-hover:shadow-sm"
        >
          <ShoppingCartIcon className="h-5 w-5 text-gray-600 group-hover:text-green-600 transition-colors duration-200" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#00a63e] text-white rounded-full text-xs flex items-center justify-center font-medium shadow-lg animate-bounce">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Button>
      </Link>
      {!isGuest && (
        <Link to="/customer/receipts" className="group">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100/80 transition-all duration-200 hover:scale-[1.02] rounded-lg"
          >
            <DocumentIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
              Receipts
            </span>
          </Button>
        </Link>
      )}
      <Link to="https://jagedoplatform.zohodesk.com/portal/en/newticket" target="_blank" className="group">
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.02] rounded-lg"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
            Help
          </span>
        </Button>
      </Link>
    </div>
  );
};

const ServiceProviderNav = ({ notifications, unreadCount, onNotificationClick, onViewAllNotifications }) => {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" className="flex items-center gap-2">
        <Link to="/dashboard/sales">
          <CubeTransparentIcon className="h-5 w-5" />
          <span>Sales</span>
        </Link>
      </Button>
      <Button asChild variant="ghost" className="flex items-center gap-2">
        <Link to="https://jagedoplatform.zohodesk.com/portal/en/newticket" target="_blank">
          <QuestionMarkCircleIcon className="h-5 w-5" />
          <span>Help</span>
        </Link>
      </Button>
      <NavComponent notifications={notifications} unreadCount={unreadCount} onNotificationClick={onNotificationClick} onViewAllNotifications={onViewAllNotifications} />
    </div>
  );
};

export function DashboardHeader() {
  const navigate = useNavigate();
  const { logout } = useGlobalContext();
  const { totalItems } = useCart();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const user_type = user?.user_type?.trim().toLowerCase();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  const serviceProviderTypes = ['contractor', 'fundi', 'professional', 'hardware'];
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const markAsRead = (notificationId: string | number) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
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
            let type = 'info';
            let originalItem = { id: null, status: null };

            try {
              const parsed = JSON.parse(apiNotif.message);
              if (typeof parsed === 'object' && parsed !== null) {
                title = parsed.title || title;
                text = parsed.text || text;
                type = parsed.type || type;
                originalItem = parsed.originalItem || originalItem;
              }
            } catch (e) {
              // Message is not a JSON string, use as is.
              if (text.includes("OTP")) {
                title = "Security Alert";
              } else if (text.includes("Welcome")) {
                title = "Welcome!";
              } else if (text.includes("Signup")) {
                title = "New User Signup";
              } else if (text.includes("Request")) {
                title = "Request Status Update";
              }
            }

            return {
              id: apiNotif.id,
              title,
              message: text,
              time: new Date(apiNotif.date).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              read: false,
              type,
              originalItem,
              category: type === 'job' ? 'Jobs' : type === 'order' ? 'Orders' : 'General',
            };
          });
          setNotifications(transformedNotifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast.error("Could not load notifications.");
      }
    };

    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getProviderProfile(axiosInstance, user.id);
          if (profile.data?.userProfile?.profileImage) {
            setProfileImage(profile.data.userProfile.profileImage);
          }
        } catch (error) {
          console.error("Failed to fetch provider profile:", error);
        }
      }
    };
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const { type, originalItem } = notification;
    const { id, status } = originalItem;

    if (!id) return;

    const paths = {
      customer: { job: '/customer', order: '/customer' },
      fundi: { job: '/fundi-portal', order: '/fundi-portal' },
      professional: { job: '/professional', order: '/professional' },
      contractor: { job: '/contractor', order: '/contractor' },
      hardware: { order: '/hardware' },
    };

    const basePath = paths[user_type]?.[type];
    if (!basePath) {
      toast.error("Cannot determine navigation path.");
      return;
    }

    let section = 'new';
    const s = status?.toLowerCase();

    if (['assigned', 'active', 'processing', 'shipped'].includes(s)) section = 'active';
    else if (s === 'bid') section = 'bid';
    else if (s === 'draft') section = 'draft';
    else if (['complete', 'completed', 'delivered'].includes(s)) section = 'complete';
    else if (s === 'quotation') section = 'quotations';

    const url = `${basePath}/${section}/${type}/${id}`;
    navigate(url);
    toast.info(`Navigating to ${notification.title}`);
  };

  const handleViewAllNotifications = () => {
    setNotificationsModalOpen(true);
  };

  const handleMarkAsRead = (notificationId: string | number) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-500 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 px-2">
      <div className="mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src="/jagedologo.png" alt="JAGEDO Logo" width={180} height={50} className="relative rounded-lg hover:scale-105 transition-transform duration-300" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {!user ? (
              <Button variant="ghost" className="text-sm font-medium text-gray-700" onClick={() => navigate("/login")}>
                Login
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a63e]">
                    <Avatar src={profileImage || user?.avatarUrl || "/images/customer-1.jpeg"} alt="User avatar" className="h-10 w-10" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button className="p-2 rounded-md hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            {(user_type === 'customer' || !user) &&
              <CustomerNav
                totalItems={totalItems}
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={handleNotificationClick}
                onViewAllNotifications={handleViewAllNotifications}
                isGuest={!user}
              />
            }

            {serviceProviderTypes.includes(user_type) &&
              <ServiceProviderNav
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={handleNotificationClick}
                onViewAllNotifications={handleViewAllNotifications}
              />
            }

            {!user ? (
              <Button variant="default" className="bg-[#00007a] hover:bg-[#00007a]/90 text-white rounded-full px-6" onClick={() => navigate("/login")}>
                Login
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a63e]">
                    <Avatar src={profileImage || user?.avatarUrl || "/images/customer-1.jpeg"} alt="User avatar" className="h-10 w-10" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t p-4 animate-fade-in-down">
          <div className="flex flex-col space-y-2">
            {(user_type === 'customer' || !user) && (
              <>
                {!user && (
                  <Link to="/login" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium text-blue-700">
                    <UserCircleIcon className="h-5 w-5" /> Login
                  </Link>
                )}
                <Link to="/customer/cart" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <ShoppingCartIcon className="h-5 w-5" /> Cart
                </Link>
                {!user && (
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100" onClick={() => window.open("https://jagedoplatform.zohodesk.com/portal/en/newticket", "_blank")}>
                    <QuestionMarkCircleIcon className="h-5 w-5" /> Help
                  </div>
                )}
                {user && (
                  <>
                    <Link to="/notifications" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                      <BellIcon className="h-5 w-5" /> Notifications
                    </Link>
                    <Link to="/customer/receipts" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                      <DocumentIcon className="h-5 w-5" /> Receipts
                    </Link>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100" onClick={() => window.open("https://jagedoplatform.zohodesk.com/portal/en/newticket", "_blank")}>
                      <QuestionMarkCircleIcon className="h-5 w-5" /> Help
                    </div>
                  </>
                )}
              </>
            )}
            {serviceProviderTypes.includes(user_type) && (
              <>
                <Link to="/dashboard/sales" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <BriefcaseIcon className="h-5 w-5" /> Sales
                </Link>
                <Link to="https://jagedoplatform.zohodesk.com/portal/en/newticket" target="_blank" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <QuestionMarkCircleIcon className="h-5 w-5" /> Help
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </header>
  );
}