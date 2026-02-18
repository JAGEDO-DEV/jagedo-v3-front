/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import { getCustomerJobRequests, getServiceProviderJobRequests } from '@/api/jobRequests.api';
import { getOrderRequests, getProviderOrderRequests } from '@/api/orderRequests.api';
import { useGlobalContext } from '@/context/GlobalProvider';

// Define more specific types for clarity
type Job = any; // Replace 'any' with your actual Job type if available
type Order = any; // Replace 'any' with your actual Order type if available

interface Notification {
    id: string;
    type: 'job' | 'order';
    title: string;
    message: string;
    time: string;
    createdAt: string;
    read: boolean;
    originalItem: Job | Order;
}

interface NotificationContextType {
    notifications: Notification[];
    allJobs: Job[];
    allOrders: Order[];
    isLoading: boolean;
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => void;
    triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useGlobalContext();
    const user_type = (user?.user_type || '').trim().toLowerCase();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const serviceProviderTypes = ['contractor', 'fundi', 'professional', 'hardware'];

    const formatTimeAgo = (isoDateString: string): string => {
        if (!isoDateString) return 'just now';
        const date = new Date(isoDateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} months ago`;
        const years = Math.floor(days / 365);
        return `${years} years ago`;
    };

    const fetchNotifications = async () => {
        setIsLoading(true);
        let allNotifications: Notification[] = [];
        try {
            if (serviceProviderTypes.includes(user_type)) {
                const [jobsResponse, ordersResponse] = await Promise.all([
                    getServiceProviderJobRequests(axiosInstance),
                    getProviderOrderRequests(axiosInstance)
                ]);

                const jobsData = jobsResponse.hashSet || [];
                setAllJobs(jobsData);
                if (Array.isArray(jobsData)) {
                    const jobNotifications = jobsData.map((item: Job): Notification => ({
                        id: `job-${item.id}`,
                        type: 'job',
                        title: `Job Update: ${item.skill || 'New Job'}`,
                        message: `A job request for '${item.skill}' has been updated. Status: ${item.status}.`,
                        createdAt: item.updatedAt || item.createdAt,
                        time: formatTimeAgo(item.updatedAt || item.createdAt),
                        read: !['request', 'new', 'available', 'bid'].includes(item.status?.toLowerCase()),
                        originalItem: item,
                    }));
                    allNotifications = allNotifications.concat(jobNotifications);
                }

                const ordersData = ordersResponse.hashSet || [];
                setAllOrders(ordersData);
                if (Array.isArray(ordersData)) {
                    const orderNotifications = ordersData.map((item: Order): Notification => ({
                        id: `order-${item.id}`,
                        type: 'order',
                        title: `Order Request`,
                        message: `New order request. Status: ${item.status}.`,
                        createdAt: item.createdAt,
                        time: formatTimeAgo(item.createdAt),
                        read: !['PENDING', 'NEW'].includes(item.status?.toUpperCase()),
                        originalItem: item,
                    }));
                    allNotifications = allNotifications.concat(orderNotifications);
                }

            } else if (user_type === 'customer') {
                const [jobsResponse, ordersResponse] = await Promise.all([
                    getCustomerJobRequests(axiosInstance),
                    getOrderRequests(axiosInstance),
                ]);

                const jobsData = jobsResponse.hashSet || [];
                setAllJobs(jobsData);
                if (Array.isArray(jobsData)) {
                    const jobNotifications = jobsData.map((item: Job): Notification => ({
                        id: `job-${item.id}`,
                        type: 'job',
                        title: `Job: ${item.skill || 'Update'}`,
                        message: `Your job request status is now ${item.status}.`,
                        createdAt: item.createdAt,
                        time: formatTimeAgo(item.createdAt),
                        read: !['PENDING', 'NEW'].includes(item.status?.toUpperCase()),
                        originalItem: item,
                    }));
                    allNotifications = allNotifications.concat(jobNotifications);
                }

                const ordersData = ordersResponse.hashSet || [];
                setAllOrders(ordersData);
                if (Array.isArray(ordersData)) {
                    const orderNotifications = ordersData.map((item: Order): Notification => ({
                        id: `order-${item.id}`,
                        type: 'order',
                        title: `Order: #${item.id.toString().slice(0, 8)}`, // Added .toString() for safety
                        message: `Your order status is now ${item.status}.`,
                        createdAt: item.createdAt,
                        time: formatTimeAgo(item.createdAt),
                        read: !['PENDING', 'NEW'].includes(item.status?.toUpperCase()),
                        originalItem: item,
                    }));
                    allNotifications = allNotifications.concat(orderNotifications);
                }
            }

            allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(allNotifications);
        } catch (error) {
            console.error('ERROR processing notification data:', error);
            setNotifications([]);
            setAllJobs([]);
            setAllOrders([]);
            toast.error('Failed to process notifications.');
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.id === id ? { ...notification, read: true } : notification
            )
        );
    };

    const triggerToast = (type: 'success' | 'error' | 'info', message: string) => {
        if (type === 'success') toast.success(message);
        else if (type === 'error') toast.error(message);
        else if (type === 'info') toast.info(message);
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const value = {
        notifications,
        allJobs,
        allOrders,
        isLoading,
        unreadCount,
        fetchNotifications,
        markAsRead,
        triggerToast,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};