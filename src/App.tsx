import { useState, useEffect, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import DashboardLayout from "@/layouts/DashboardLayout"
import Login from "@/pages/Login"

// Lazy-loaded pages (code splitting)
const Dashboard = lazy(() => import("@/pages/Dashboard"))
const Diagnosis = lazy(() => import("@/pages/Diagnosis"))
const UsersPage = lazy(() => import("@/pages/Users"))
const Consultations = lazy(() => import("@/pages/Consultations"))
const Endpoints = lazy(() => import("@/pages/Endpoints"))
const Settings = lazy(() => import("@/pages/Settings"))
const Prompts = lazy(() => import("@/pages/Prompts"))
const Profile = lazy(() => import("@/pages/Profile"))
const Register = lazy(() => import("@/pages/Register"))
const RegisterGestor = lazy(() => import("@/pages/RegisterGestor"))
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"))
const ResetPassword = lazy(() => import("@/pages/ResetPassword"))
const Notifications = lazy(() => import("@/pages/Notifications"))
const AuditLogs = lazy(() => import("@/pages/AuditLogs"))
const Plans = lazy(() => import("@/pages/Plans"))
const Calculators = lazy(() => import("@/pages/Calculators"))
const SystemHealth = lazy(() => import("@/pages/SystemHealth"))
const ClinicDashboard = lazy(() => import("@/pages/ClinicDashboard"))
const Vagas = lazy(() => import("@/pages/Vagas"))
const Protocols = lazy(() => import("@/pages/Protocols"))
const Support = lazy(() => import("@/pages/Support"))
const AdminPromoCodes = lazy(() => import("@/pages/admin/AdminPromoCodes"))
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const fallback = (
    <div className="flex items-center justify-center h-[300px]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )

  return (
    <NotificationProvider>
      <DashboardLayout currentPath={currentPath} onNavigate={setCurrentPath}>
        <Suspense fallback={fallback}>
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
        </Suspense>
      </DashboardLayout>
    </NotificationProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="medipro-theme">
        <AuthProvider>
          <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-clinic" element={<RegisterGestor />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
