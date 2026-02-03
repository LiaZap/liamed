import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { jwtDecode } from 'jwt-decode';
import { TermsModal } from '@/components/TermsModal';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    plan?: 'ESSENTIAL' | 'PRO' | 'PREMIUM' | null;
    planStatus?: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | null;
    termsAcceptedAt?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const refreshUser = async () => {
        try {
            const response = await api.get('/users/profile');
            setUser(response.data);
            
            // Check if terms need to be accepted (only for non-admin users)
            if (response.data && !response.data.termsAcceptedAt && response.data.role !== 'ADMIN') {
                setShowTermsModal(true);
            } else {
                setShowTermsModal(false);
            }
        } catch (err) {
            console.error("Failed to refresh user", err);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('medipro-token');
            if (token) {
                try {
                    // Decodificar token para verificar validade básica
                    const decoded: any = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decoded.exp < currentTime) {
                        logout();
                    } else {
                        // Buscar dados atualizados do perfil
                        try {
                            const response = await api.get('/users/profile');
                            setUser(response.data);
                            
                            // Check if terms need to be accepted (only for non-admin users)
                            if (response.data && !response.data.termsAcceptedAt && response.data.role !== 'ADMIN') {
                                setShowTermsModal(true);
                            }
                        } catch (err) {
                            // Se falhar o profile, usa dados do token
                            console.error("Failed to fetch profile", err);
                            setUser({
                                id: decoded.id,
                                name: decoded.name,
                                email: decoded.email,
                                role: decoded.role
                            });
                        }
                    }
                } catch (error) {
                    console.error("Invalid token", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('medipro-token', token);
        setUser(userData);
        
        // Check if terms need to be accepted after login
        if (userData && !userData.termsAcceptedAt && userData.role !== 'ADMIN') {
            setShowTermsModal(true);
        }
    };

    const logout = () => {
        localStorage.removeItem('medipro-token');
        setUser(null);
        setShowTermsModal(false);
        window.location.href = '/';
    };

    const handleTermsAccepted = () => {
        setShowTermsModal(false);
        // Refresh user data to get updated termsAcceptedAt
        refreshUser();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
            {children}
            {/* Terms Modal - shown when user hasn't accepted terms */}
            <TermsModal 
                isOpen={showTermsModal} 
                onAccept={handleTermsAccepted} 
            />
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
