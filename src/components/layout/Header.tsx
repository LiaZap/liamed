import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar, type NavItem } from "./Sidebar"
import {
    Bell, Menu, Moon, Sun, X, Info, CheckCircle, AlertTriangle, AlertOctagon,
    LogOut, User
} from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications, type NotificationType, type Notification } from "@/contexts/NotificationContext"
import { useTranslation } from "react-i18next"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"
import { getImageUrl } from "@/utils/url"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

interface HeaderProps {
    currentPath: NavItem
    onNavigate: (path: NavItem) => void
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
    switch (type) {
        case 'info': return <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-slate-300"><Info className="h-4 w-4" /></div>
        case 'success': return <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><CheckCircle className="h-4 w-4" /></div>
        case 'warning': return <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><AlertTriangle className="h-4 w-4" /></div>
        case 'error': return <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><AlertOctagon className="h-4 w-4" /></div>
    }
}

export function Header({ currentPath, onNavigate }: HeaderProps) {
    // Hooks
    const { t, i18n } = useTranslation();
    const { toggleTheme, isDark } = useTheme()
    const { user, logout } = useAuth()
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    // Derived state


    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        
        // If it has an image, open the modal
        if (notification.imageUrl) {
            setSelectedNotification(notification);
            setIsNotificationOpen(false);
            return;
        }

        // Standard navigation
        if (notification.link) {
            if (notification.link === '/notificacoes' || notification.link === '/usuarios' || notification.link === '/diagnostico' || notification.link === '/consultas' || notification.link === '/configuracoes') {
                // Map link to NavItem
                const mapPath: Record<string, NavItem> = {
                    '/notificacoes': 'Notificações',
                    '/usuarios': 'Usuários',
                    '/diagnostico': 'Diagnóstico',
                    '/consultas': 'Consultas',
                    '/configuracoes': 'Configurações'
                }
                const navItem = mapPath[notification.link];
                if (navItem) onNavigate(navItem);
            } else if (notification.link.startsWith('http')) {
                window.open(notification.link, '_blank');
            }
            setIsNotificationOpen(false);
        }
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#222428]/95 backdrop-blur px-6 flex items-center justify-between md:pl-[264px] transition-colors shadow-sm dark:shadow-slate-950/50">
            {/* Mobile Toggle & Title */}
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px] border-none">
                        <Sidebar className="w-full" currentPath={currentPath} onNavigate={onNavigate} />
                    </SheetContent>
                </Sheet>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 hidden md:block">
                    {currentPath === "Diagnóstico" ? t('header.diagnosis_title') : t('header.overview_title')}
                </h1>
                <div className="md:hidden flex items-center">
                    <img
                        src={isDark ? LogoLiamedWhite : LogoLiamed}
                        alt="LIAMED Logo"
                        className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-muted-foreground hidden lg:block mr-1">{t('header.choose_language')}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-2 ${i18n.language === 'pt' ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        onClick={() => i18n.changeLanguage('pt')}
                        title="Português"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 50" className="w-6 h-6 rounded-sm shadow-sm">
                            <rect width="72" height="50" fill="#009c3b" rx="2" ry="2" />
                            <polygon points="36,4 68,25 36,46 4,25" fill="#ffdf00" />
                            <circle cx="36" cy="25" r="13" fill="#002776" />
                            <path d="M 24,25 A 25,25 0 0,0 48,25" fill="none" stroke="#fff" strokeWidth="2" />
                        </svg>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-2 ${i18n.language === 'en' ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        onClick={() => i18n.changeLanguage('en')}
                        title="English"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 50" className="w-6 h-6 rounded-sm shadow-sm">
                            <rect width="72" height="50" fill="#bf0a30" rx="2" ry="2" />
                            <rect width="72" height="3.8" y="3.8" fill="#fff" />
                            <rect width="72" height="3.8" y="11.4" fill="#fff" />
                            <rect width="72" height="3.8" y="19" fill="#fff" />
                            <rect width="72" height="3.8" y="26.6" fill="#fff" />
                            <rect width="72" height="3.8" y="34.2" fill="#fff" />
                            <rect width="72" height="3.8" y="41.8" fill="#fff" />
                            <rect width="28" height="26" fill="#002868" rx="1" ry="1" />
                            {/* Simplified starts pattern */}
                            <circle cx="5" cy="5" r="1.5" fill="#fff" /> <circle cx="14" cy="5" r="1.5" fill="#fff" /> <circle cx="23" cy="5" r="1.5" fill="#fff" />
                            <circle cx="9.5" cy="9" r="1.5" fill="#fff" /> <circle cx="18.5" cy="9" r="1.5" fill="#fff" />
                            <circle cx="5" cy="13" r="1.5" fill="#fff" /> <circle cx="14" cy="13" r="1.5" fill="#fff" /> <circle cx="23" cy="13" r="1.5" fill="#fff" />
                            <circle cx="9.5" cy="17" r="1.5" fill="#fff" /> <circle cx="18.5" cy="17" r="1.5" fill="#fff" />
                            <circle cx="5" cy="21" r="1.5" fill="#fff" /> <circle cx="14" cy="21" r="1.5" fill="#fff" /> <circle cx="23" cy="21" r="1.5" fill="#fff" />
                        </svg>
                    </Button>
                </div>

                {/* Notifications */}
                <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full w-10 h-10 transition-transform active:scale-95"
                        >
                            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[shake_0.5s_ease-in-out]' : ''}`} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 h-[18px] min-w-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white dark:border-slate-900 font-bold animate-in zoom-in">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0 mr-4 shadow-xl dark:shadow-slate-950 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" align="end">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{t('header.notifications')}</h4>
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                                        {t('header.new_notifications', { count: unreadCount })}
                                    </Badge>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-transparent"
                                    onClick={markAllAsRead}
                                >
                                    {t('header.mark_all_read')}
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="h-[360px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                                    <Bell className="h-8 w-8 opacity-20" />
                                    <p className="text-sm">{t('header.no_notifications')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "relative flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group",
                                                !notification.read && "bg-blue-50/50 dark:bg-slate-800/30"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            {!notification.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-900 dark:bg-slate-100" />
                                            )}

                                            <NotificationIcon type={notification.type} />

                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <p className={cn("text-sm font-medium leading-none", !notification.read ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400")}>
                                                        {!notification.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-100 mr-1.5 mb-0.5" />}
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                            <Button
                                variant="link"
                                className="text-xs h-auto p-0 text-blue-600 dark:text-blue-400"
                                onClick={() => {
                                    setIsNotificationOpen(false);
                                    onNavigate("Notificações");
                                }}
                            >
                                {t('header.view_all_notifications')}
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                    onClick={toggleTheme}
                    title={isDark ? t('header.theme_light') : t('header.theme_dark')}
                >
                    <div className="relative w-5 h-5">
                        <Sun className={`absolute inset-0 h-5 w-5 transform transition-transform duration-500 rotate-0 ${isDark ? 'rotate-[180deg] opacity-0 scale-0' : 'rotate-0 opacity-100 scale-100'}`} />
                        <Moon className={`absolute inset-0 h-5 w-5 transform transition-transform duration-500 rotate-0 ${isDark ? 'rotate-0 opacity-100 scale-100' : 'rotate-[-180deg] opacity-0 scale-0'}`} />
                    </div>
                </Button>

                {/* User Menu */}
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors">
                            <div className="text-right hidden sm:block">
                                <div className="flex items-center justify-end gap-2">
                                    <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">{user?.name || 'Usuário'}</p>
                                </div>
                                <div className="mt-1 flex justify-end">
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-100 border-none">
                                        {user?.role || 'MÉDICO'}
                                    </Badge>
                                </div>
                            </div>
                            <Avatar className="h-8 w-8 border dark:border-slate-700">
                                <AvatarFallback className="bg-slate-200 text-slate-700 text-xs dark:bg-slate-700 dark:text-slate-200">
                                    {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1 mr-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg" align="end">
                        <div className="space-y-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 h-9 font-normal dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                                onClick={() => onNavigate('Perfil')}
                            >
                                <User className="h-4 w-4 text-muted-foreground scale-90" />
                                {t('header.my_profile')}
                            </Button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 h-9 font-normal text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={logout}
                            >
                                <LogOut className="h-4 w-4 scale-90" />
                                {t('header.logout')}
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{selectedNotification?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedNotification?.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                                <img 
                                    src={getImageUrl(selectedNotification.imageUrl)} 
                                    alt="Notification" 
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedNotification?.message}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                            Fechar
                        </Button>
                        {selectedNotification?.link && selectedNotification.link !== '#' && (
                            <Button onClick={() => {
                                if (selectedNotification.link!.startsWith('http')) {
                                    window.open(selectedNotification.link, '_blank');
                                } else {
                                    // Internal navigation handled via simplified redirect or just close
                                    // For now just allow closing, as internal nav logic inside click handler is cleaner
                                    // We could force re-trigger navigation but simple is better
                                    
                                     const mapPath: Record<string, NavItem> = {
                                        '/notificacoes': 'Notificações',
                                        '/usuarios': 'Usuários',
                                        '/diagnostico': 'Diagnóstico',
                                        '/consultas': 'Consultas',
                                        '/configuracoes': 'Configurações'
                                    }
                                    const navItem = mapPath[selectedNotification.link!];
                                    if (navItem) onNavigate(navItem);
                                }
                                setSelectedNotification(null);
                            }}>
                                Acessar Link
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    )
}
