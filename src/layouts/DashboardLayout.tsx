import { Sidebar, type NavItem } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

interface DashboardLayoutProps {
    children: React.ReactNode
    currentPath: NavItem
    onNavigate: (path: NavItem) => void
}

export default function DashboardLayout({ children, currentPath, onNavigate }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#1a1c1f] transition-colors duration-300">
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
