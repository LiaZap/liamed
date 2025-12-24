import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Pencil,
    Lock,
    Eye,
    EyeOff,
    Trash2,
    CreditCard
} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { type NavItem } from "@/components/layout/Sidebar"

interface ProfileProps {
    onNavigate?: (path: NavItem) => void
}

export default function Profile({ onNavigate }: ProfileProps) {
    const { user: authUser, logout, refreshUser } = useAuth() // Assuming refreshUser exists or we fetch manually
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

    // Edit Form State
    const [editName, setEditName] = useState("")
    const [editPhone, setEditPhone] = useState("")
    const [editAddress, setEditAddress] = useState("")
    const [editBio, setEditBio] = useState("")
    const [saving, setSaving] = useState(false)

    // Password Visibility States
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Delete Account State
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const response = await api.get('/users/profile')
            setUser(response.data)
            // Init edit form
            setEditName(response.data.name || "")
            setEditPhone(response.data.phone || "")
            setEditAddress(response.data.address || "")
            setEditBio(response.data.biography || "")
        } catch (error) {
            console.error("Failed to fetch profile", error)
            toast.error("Erro ao carregar perfil")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const updatedData = {
                name: editName,
                phone: editPhone,
                address: editAddress,
                biography: editBio
            }
            // Use user.id from state or auth context
            const userId = user?.id || authUser?.id
            await api.put(`/users/${userId}`, updatedData)

            toast.success("Perfil atualizado com sucesso!")
            setIsEditModalOpen(false)
            fetchProfile() // Refresh data
        } catch (error) {
            console.error("Failed to update profile", error)
            toast.error("Erro ao atualizar perfil")
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/users'); // Using /users as it maps to deletion of self in updated routes
            toast.success(t('profile.toasts.delete_success'))
            logout()
        } catch (error) {
            console.error("Failed to delete account", error)
            toast.error(t('profile.toasts.delete_error'), {
                description: t('common.error')
            })
        }
    }

    if (loading && !user) {
        return <div className="p-8 text-center text-muted-foreground">Carregando perfil...</div>
    }

    // Fallback if fetch fails but we have authUser
    const displayUser = user || authUser || {}

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('profile.title')}</h1>
                <Button className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={() => setIsEditModalOpen(true)}>
                    <Pencil className="h-4 w-4" /> {t('profile.edit')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                {/* Column 1 - Profile Card */}
                <Card className="md:col-span-2 shadow-sm dark:bg-[#222428] dark:border-slate-800">
                    <CardContent className="pt-8 px-8 pb-8 flex flex-col items-center text-center space-y-6">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg dark:border-slate-700">
                                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-3xl font-bold">
                                    {displayUser.name?.substring(0, 2).toUpperCase() || "US"}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{displayUser.name || "Usuário"}</h2>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-semibold dark:bg-slate-800 dark:text-white">
                                {displayUser.role || "MÉDICO"}
                            </Badge>
                        </div>

                        {/* Details List */}
                        <div className="w-full space-y-4 pt-2">
                            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                                <span className="text-sm text-muted-foreground">{t('profile.member_since')}</span>
                                <span className="text-sm font-medium dark:text-slate-200">
                                    {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
                                <span className="text-sm text-muted-foreground">{t('profile.last_access')}</span>
                                <span className="text-sm font-medium dark:text-slate-200">
                                    {displayUser.lastLogin ? new Date(displayUser.lastLogin).toLocaleDateString() : "Hoje"}
                                </span>
                            </div>
                        </div>

                        {/* Action */}
                        <Button
                            variant="outline"
                            className="w-full gap-2 mt-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            onClick={() => setIsPasswordModalOpen(true)}
                        >
                            <Lock className="h-4 w-4" /> {t('profile.change_password')}
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full gap-2 mt-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            onClick={() => onNavigate?.('Planos')}
                        >
                            <CreditCard className="h-4 w-4" /> {t('plans.title')}
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full gap-2 mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                            onClick={() => setIsDeleteAlertOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" /> {t('profile.delete_account')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Column 2 - Personal Info */}
                <Card className="md:col-span-3 shadow-sm h-fit dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader className="pb-4 border-b dark:border-slate-800">
                        <CardTitle className="text-lg font-semibold dark:text-slate-50">{t('profile.personal_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground font-medium dark:text-slate-400">{t('profile.full_name')}</Label>
                            <p className="text-base font-normal text-slate-900 dark:text-slate-100">{displayUser.name || "-"}</p>
                        </div>

                        {/* Email / Phone Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground font-medium dark:text-slate-400">{t('profile.email')}</Label>
                                <p className="text-base font-normal text-slate-900 dark:text-slate-100">{displayUser.email || "-"}</p>
                                <p className="text-xs text-muted-foreground italic">{t('profile.email_hint')}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground font-medium dark:text-slate-400">{t('profile.phone')}</Label>
                                <p className={`text-base font-normal ${displayUser.phone ? "text-slate-900 dark:text-slate-100" : "text-slate-400 italic"}`}>
                                    {displayUser.phone || t('profile.not_informed')}
                                </p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground font-medium dark:text-slate-400">{t('profile.address')}</Label>
                            <p className={`text-base font-normal ${displayUser.address ? "text-slate-900 dark:text-slate-100" : "text-slate-400 italic"}`}>
                                {displayUser.address || t('profile.not_informed')}
                            </p>
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground font-medium dark:text-slate-400">{t('profile.bio')}</Label>
                            <p className={`text-base font-normal ${displayUser.biography ? "text-slate-900 dark:text-slate-100" : "text-slate-400 italic"}`}>
                                {displayUser.biography || t('profile.no_bio')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Profile Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-[600px] w-full p-0 gap-0 bg-white dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader className="p-6 border-b dark:border-slate-800">
                        <DialogTitle className="text-xl font-bold dark:text-slate-50">{t('profile.edit')}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.full_name')}</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.phone')}</Label>
                            <Input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.address')}</Label>
                            <Input
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                placeholder={t('profile.address_placeholder')}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.bio')}</Label>
                            <Textarea
                                rows={4}
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder={t('profile.bio_placeholder')}
                                maxLength={500}
                                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                            />
                            <p className="text-xs text-right text-muted-foreground">{editBio.length}/500</p>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t sm:justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="dark:text-slate-400">{t('common.cancel')}</Button>
                        <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                            {saving ? 'Salvando...' : t('profile.save_changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="max-w-[500px] w-full p-0 gap-0 bg-white dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader className="p-6 border-b dark:border-slate-800">
                        <DialogTitle className="text-xl font-bold dark:text-slate-50">{t('profile.change_password')}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.current_password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    className="pl-9 pr-9 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.new_password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    className="pl-9 pr-9 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{t('profile.min_chars')}</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('profile.confirm_password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="pl-9 pr-9 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t sm:justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                        <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)} className="dark:text-slate-400">{t('common.cancel')}</Button>
                        <Button className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">{t('profile.change_password')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Account Alert */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 dark:text-slate-50">
                            <Trash2 className="h-5 w-5 text-red-600" /> {t('profile.delete_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            {t('profile.delete_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600" onClick={handleDeleteAccount}>
                            {t('profile.confirm_delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
