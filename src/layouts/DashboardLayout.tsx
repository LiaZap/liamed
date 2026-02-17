import { Sidebar, type NavItem } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useAuth } from "@/contexts/AuthContext"
import { SubscriptionExpiredModal } from "@/components/subscription/SubscriptionExpiredModal"

interface DashboardLayoutProps {
    children: React.ReactNode
    currentPath: NavItem
    onNavigate: (path: NavItem) => void
}

export default function DashboardLayout({ children, currentPath, onNavigate }: DashboardLayoutProps) {
    const { user } = useAuth();

    // Lock logic:
    // 1. Not Admin
    // 2. Plan Status is NOT Active or Trialing (meaning it is Canceled, Past Due, etc.)
    // 3. Current path is NOT 'Planos' (user needs to go to Plans to pay)
    
    // Note: If user has NO subscription history, backend defaults to Essential Active.
    // If they had a sub and it expired, backend now returns the expired status (e.g. CANCELED).
    
    const isPlanExpired = user?.role !== 'ADMIN' && 
                          user?.planStatus && 
                          !['ACTIVE', 'TRIALING'].includes(user.planStatus);

    const showLock = isPlanExpired && currentPath !== 'Planos';

    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#1a1c1f] transition-colors duration-300">
            <SubscriptionExpiredModal isOpen={!!showLock} />
            
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50">
                <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
            </div>

            {/* Header */}
            <Header currentPath={currentPath} onNavigate={onNavigate} />

            {/* Main Content */}
            <main className="md:ml-[240px] pt-16 min-h-[calc(100vh)] transition-all">
                <div className="p-6 h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
