/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  Receipt,
  HelpCircle,
  ShoppingCart,
  Search,
  Menu,
  LogOut,
  Settings,
  UserCircle,
  Plus,
  MessageSquare,
  Star,
  CreditCard,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { NotificationsModal } from "@/components/NotificationsModal"

interface EnhancedTopNavProps {
  userType: "customer" | "fundi" | "professional" | "contractor" | "builder" | "hardware" | "admin"
  notifications?: any[]
  cartItems?: any[]
  onMobileMenuToggle?: () => void
  showSearch?: boolean
  showCart?: boolean
  showBreadcrumbs?: boolean
  breadcrumbItems?: any[]
  onReceiptsClick?: () => void
}

export function EnhancedTopNav({
  userType,
  notifications = [],
  cartItems = [],
  onMobileMenuToggle,
  showSearch = false,
  showCart = false,
  showBreadcrumbs = true,
  breadcrumbItems,
  onReceiptsClick,
}: EnhancedTopNavProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [notificationsPopoverOpen, setNotificationsPopoverOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleViewAllNotifications = () => {
    setNotificationsPopoverOpen(false)
    setNotificationsModalOpen(true)
  }

  const handleNotificationClick = (notification: any) => {
    // Handle individual notification click
    console.log('Notification clicked:', notification)
  }

  const handleMarkAsRead = (notificationId: string | number) => {
    // Handle marking notification as read
    console.log('Mark as read:', notificationId)
  }

  const handleMarkAllAsRead = () => {
    // Handle marking all notifications as read
    console.log('Mark all as read')
  }

  const getuserTypeLabel = () => {
    switch (userType) {
      case "customer":
        return "Customer Portal"
      case "fundi":
        return "Fundi Portal"
      case "professional":
        return "Professional Portal"
      case "contractor":
        return "Contractor Portal"
      case "builder":
        return "Builder Portal"
      case "hardware":
        return "Hardware Portal"
      case "admin":
        return "Admin Panel"
      default:
        return "JAGEDO"
    }
  }

  const getQuickActions = () => {
    switch (userType) {
      case "customer":
        return [
          { label: "New Request", icon: Plus, href: "/dashboard/customer?section=requisitions" },
          { label: "Find Services", icon: Search, href: "/services" },
        ]
      case "fundi":
        return [
          { label: "Browse Jobs", icon: Search, href: "/dashboard/fundi?section=new" },
          { label: "My Bids", icon: Star, href: "/dashboard/fundi?section=bidding" },
        ]
      case "professional":
        return [
          { label: "New Projects", icon: Search, href: "/dashboard/professional?section=new" },
          { label: "Submit Proposal", icon: Plus, href: "/dashboard/professional/proposals/new" },
        ]
      case "contractor":
        return [
          { label: "Project Bids", icon: Search, href: "/dashboard/contractor?section=bidding" },
          { label: "Team Management", icon: UserCircle, href: "/dashboard/contractor/team" },
        ]
      case "builder":
        return [
          { label: "New Projects", icon: Plus, href: "/dashboard/builder?section=new" },
          { label: "Active Work", icon: Settings, href: "/dashboard/builder?section=active" },
        ]
      case "hardware":
        return [
          { label: "New Orders", icon: Plus, href: "/dashboard/hardware?section=new" },
          { label: "Inventory", icon: Settings, href: "/dashboard/hardware?section=inventory" },
        ]
      default:
        return []
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto">
        {/* Main Navigation */}
        <div className="flex h-16 items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {onMobileMenuToggle && (
              <button
                className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={onMobileMenuToggle}
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/placeholder.svg?height=40&width=40"
                alt="JAGEDO Logo"
                width={40}
                height={40}
                className="rounded"
              />
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-[#00007a]">JAGEDO</span>
                <div className="text-xs text-gray-500">{getuserTypeLabel()}</div>
              </div>
            </Link>

            {/* Desktop Search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs, services, materials..."
                    className="pl-10 w-80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            {showSearch && (
              <button
                className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              >
                {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
            )}

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {getQuickActions().map((action, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <Link to={action.href} className="flex items-center">
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Popover open={notificationsPopoverOpen} onOpenChange={setNotificationsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Notifications</h3>
                    <Badge variant="secondary">{notifications.filter((n) => !n.read).length} new</Badge>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && <span className="h-2 w-2 bg-blue-500 rounded-full"></span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={handleViewAllNotifications}
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Messages */}
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Receipts/Invoices */}
            <Button variant="ghost" size="icon" onClick={onReceiptsClick}>
              <Receipt className="h-5 w-5" />
            </Button>

            {/* Cart (for customers and hardware) */}
            {showCart && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#00a63e] text-white rounded-full text-xs flex items-center justify-center">
                        {cartItems.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  {cartItems.length > 0 ? (
                    <div>
                      <div className="p-4 border-b">
                        <h3 className="font-medium">Shopping Cart</h3>
                      </div>
                      <div className="max-h-60 overflow-auto">
                        {cartItems.map((item) => (
                          <div key={item.id} className="p-4 border-b last:border-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-medium">KES {item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t">
                        <Button className="w-full bg-[#00a63e] hover:bg-[#00a63e]/90">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Checkout
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Your cart is empty</p>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Help */}
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <img
                    src="/placeholder.svg?height=40&width=40"
                    alt="User avatar"
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-gray-200"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Star className="mr-2 h-4 w-4" />
                  <span>Reviews</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && showMobileSearch && (
          <div className="md:hidden border-t p-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs, services, materials..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
        )}

        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <div className="border-t px-4 py-3 bg-gray-50">
            <BreadcrumbNav items={breadcrumbItems} />
          </div>
        )}
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </header>
  )
}
