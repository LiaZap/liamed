import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';
// import { v4 as uuidv4 } from 'uuid'; // Unused

// Helper for ID generator if uuid is missing, though recommended to install
const generateId = () => Math.random().toString(36).substr(2, 9);

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string; // ISO string for storage safety
    link?: string;
}

interface NotificationContexttype {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContexttype | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth();

    // Generate user-specific storage key
    const storageKey = user?.id ? `medipro-notifications-${user.id}` : 'medipro-notifications-guest';

    // Load from local storage on mount or user change
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setNotifications(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse notifications", e);
                setNotifications([]);
            }
        } else {
            setNotifications([]);
        }
    }, [storageKey]);

    // Save to local storage on change
    useEffect(() => {
        if (notifications.length > 0 || localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, JSON.stringify(notifications));
        }
    }, [notifications, storageKey]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = (data: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
        const newNotification: Notification = {
            ...data,
            id: generateId(),
            read: false,
            createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    // Poll for notifications and unread support tickets
    const refreshNotifications = async () => {
        if (!user) return;

        try {
            const [ticketsResponse, notificationsResponse] = await Promise.all([
                api.get('/support/tickets'),
                api.get('/notifications')
            ]);

            const tickets = ticketsResponse.data;
            const apiNotifications = notificationsResponse.data;

            // Convert API notifications
            const formattedApiNotifications: Notification[] = apiNotifications.map((n: any) => ({
                id: n.id,
                type: n.type.toLowerCase(),
                title: n.title,
                message: n.message,
                read: n.read,
                createdAt: n.createdAt,
                link: n.link
            }));

            // Generate ticket notifications
            const ticketNotifications: Notification[] = [];
            tickets.forEach((ticket: any) => {
                if (ticket.unreadCount > 0) {
                   ticketNotifications.push({
                        id: `ticket-${ticket.id}`, // Virtual ID
                        type: 'info',
                        title: 'Nova mensagem no suporte',
                        message: `Você tem ${ticket.unreadCount} nova(s) resposta(s) no ticket: ${ticket.subject}`,
                        read: false,
                        createdAt: ticket.updatedAt || new Date().toISOString(),
                        link: '/suporte'
                   });
                }
            });

            // Combine and sort by date desc
            const allNotifications = [...formattedApiNotifications, ...ticketNotifications].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setNotifications(allNotifications);

        } catch (error) {
            console.error("Failed to refresh notifications", error);
        }
    };

    useEffect(() => {
        refreshNotifications(); // Check immediately
        const interval = setInterval(refreshNotifications, 10000); // Check every 10s

        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id: string) => {
        // If it's a virtual ticket notification, we don't mark as read via API here
        // (It gets cleared when user visits support page and unread count goes to 0)
        if (id.startsWith('ticket-')) {
             setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
             return;
        }

        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        
        // Only mark real notifications as read on backend
        // Virtual ones are handled by UI interactions mostly
        notifications.filter(n => !n.id.startsWith('ticket-')).forEach(n => {
             api.patch(`/notifications/${n.id}/read`).catch(console.error);
        });
    };

    const deleteNotification = async (id: string) => {
         if (id.startsWith('ticket-')) {
             setNotifications(prev => prev.filter(n => n.id !== id));
             return;
        }

        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
             console.error("Failed to delete notification", error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
