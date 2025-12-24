import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                        // Opcional: Buscar dados atualizados do perfil
                        try {
                            const response = await api.get('/users/profile');
                            setUser(response.data);
                        } catch (err) {
                            // Se falhar o profile, usa dados do token ou faz logout
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
        // Configurar header padrão para requisições imediatas se necessário, 
        // mas o interceptor já resolve isso.
    };

    const logout = () => {
        localStorage.removeItem('medipro-token');
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
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
