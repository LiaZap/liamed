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

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    // Poll for unread support tickets
    useEffect(() => {
        if (!user) return;

        const checkSupportTickets = async () => {
            try {
                const response = await api.get('/support/tickets');
                const tickets = response.data;
                
                tickets.forEach((ticket: any) => {
                    if (ticket.unreadCount > 0) {
                        // Check if we already have an unread notification for this ticket
                        // We use the link to identify the ticket-specific notification
                        const hasNotification = notifications.some(
                            n => !n.read && n.link === '/suporte' && n.message.includes(ticket.subject)
                        );

                        if (!hasNotification) {
                            addNotification({
                                type: 'info',
                                title: 'Nova mensagem no suporte',
                                message: `Você tem ${ticket.unreadCount} nova(s) resposta(s) no ticket: ${ticket.subject}`,
                                link: '/suporte'
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to check support tickets", error);
            }
        };

        checkSupportTickets(); // Check immediately
        const interval = setInterval(checkSupportTickets, 10000); // Check every 10s (more frequent than 30s for better responsiveness)

        return () => clearInterval(interval);
    }, [user, notifications]); // Depend on notifications to know if we already have one

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
