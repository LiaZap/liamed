import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import DashboardLayout from "@/layouts/DashboardLayout"
import Dashboard from "@/pages/Dashboard"
import Diagnosis from "@/pages/Diagnosis"
import UsersPage from "@/pages/Users"
import Consultations from "@/pages/Consultations"
import Endpoints from "@/pages/Endpoints"
import Settings from "@/pages/Settings"
import Prompts from "@/pages/Prompts"
import Profile from "@/pages/Profile"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import RegisterGestor from "@/pages/RegisterGestor"
import ForgotPassword from "@/pages/ForgotPassword"
import ResetPassword from "@/pages/ResetPassword"
import Notifications from "@/pages/Notifications"
import AuditLogs from "@/pages/AuditLogs"
import Plans from "@/pages/Plans"
import Calculators from "@/pages/Calculators"
import SystemHealth from "@/pages/SystemHealth"
import ClinicDashboard from "@/pages/ClinicDashboard"
import Vagas from "@/pages/Vagas"
import Protocols from "@/pages/Protocols"
import Support from "@/pages/Support"
import AdminPromoCodes from "@/pages/admin/AdminPromoCodes"
import { type NavItem } from "@/components/layout/Sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  
  // Initialize with path from URL or default to Dashboard
  const getPathFromUrl = (pathname: string): NavItem => {
    const path = pathname.split('/')[1]
    switch (path) {
      case 'dashboard': return 'Dashboard'
      case 'clinica': return 'Clínica'
      case 'diagnostico': return 'Diagnóstico'
      case 'usuarios': return 'Usuários'
      case 'consultas': return 'Consultas'
      case 'endpoints': return 'Endpoints'
      case 'configuracoes': return 'Configurações'
      case 'prompts': return 'Prompts'
      case 'calculadoras': return 'Calculadoras'
      case 'health': return 'Health'
      case 'perfil': return 'Perfil'
      case 'notificacoes': return 'Notificações'
      case 'logs': return 'Logs'
      case 'planos': return 'Planos'
      case 'vagas': return 'Vagas'
      case 'protocolos': return 'Protocolos'
      case 'suporte': return 'Suporte'
      case 'codigos-promo': return 'Códigos Promocionais'
      default: return 'Dashboard'
    }
  }

  const [currentPath, setCurrentPath] = useState<NavItem>(() => getPathFromUrl(window.location.pathname))

  // Update state when URL changes
  useEffect(() => {
    setCurrentPath(getPathFromUrl(location.pathname))
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <NotificationProvider>
      <DashboardLayout currentPath={currentPath} onNavigate={setCurrentPath}>
        {currentPath === "Dashboard" && <Dashboard />}
        {currentPath === "Clínica" && <ClinicDashboard />}
        {currentPath === "Diagnóstico" && <Diagnosis />}
        {currentPath === "Usuários" && <UsersPage />}
        {currentPath === "Consultas" && <Consultations />}
        {currentPath === "Endpoints" && <Endpoints />}
        {currentPath === "Configurações" && <Settings />}
        {currentPath === "Prompts" && <Prompts />}
        {currentPath === "Calculadoras" && <Calculators />}
        {currentPath === "Health" && <SystemHealth />}
        {currentPath === "Perfil" && <Profile onNavigate={setCurrentPath} />}
        {currentPath === "Notificações" && <Notifications />}
        {currentPath === "Logs" && <AuditLogs />}
        {currentPath === "Planos" && <Plans />}
        {currentPath === "Vagas" && <Vagas />}
        {currentPath === "Protocolos" && <Protocols />}
        {currentPath === "Suporte" && <Support />}
        {currentPath === "Códigos Promocionais" && <AdminPromoCodes />}

        {currentPath === "Others" && (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            <p>Página em construção</p>
          </div>
        )}
      </DashboardLayout>
    </NotificationProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="medipro-theme">
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-clinic" element={<RegisterGestor />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
