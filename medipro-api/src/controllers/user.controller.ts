import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ... imports
import { logAction } from "../services/audit.service";

// ... existing getProfile/listUsers

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    // Security: Only ADMIN can create users
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ 
        error: "Acesso negado. Apenas administradores podem criar usuários." 
      });
    }

    const { name, email, password, role, status, endpointId, specialty } =
      req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: "Email já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "MEDICO",
        status: status || "ATIVO",
        endpointId: endpointId || null,
        specialty: specialty || null,
        customPrompt: req.body.customPrompt || null,
        clinicId: req.body.clinicId || null // Admin can assign clinic
      },
    });

    // Audit Log
    await logAction({
      userId: req.user.id,
      userName: req.user.name || "Unknown",
      action: "CREATE",
      resource: "USER",
      resourceId: user.id,
      details: { name, email, role },
      req,
    });

    res.status(201).json(user);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      password,
      role,
      status,
      biography,
      phone,
      address,
      endpointId,
      customPrompt,
      specialty,
      notifyVagasWhatsApp,
      notifyVagasEmail,
      plan,          // New field
      planStatus,     // New field
      clinicId       // New field
    } = req.body;
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    // Security Check: Only Admin or Self can update
    if (requestingUserRole !== "ADMIN" && requestingUserId !== id) {
      return res
        .status(403)
        .json({
          error:
            "Acesso negado. Você não tem permissão para editar este usuário.",
        });
    }

    // Security Check: Only Admin can change role or status or plan
    if (requestingUserRole !== "ADMIN" && (role || status || plan || planStatus)) {
      return res
        .status(403)
        .json({
          error:
            "Acesso negado. Apenas administradores podem alterar funções, status ou planos.",
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      name,
      email,
      role,
      status,
      biography,
      phone,
      address,
      endpointId,
      customPrompt,
      specialty,
      notifyVagasWhatsApp,
      notifyVagasEmail,
      clinicId
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    // Remove undefined fields
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key],
    );

    // Transaction to update user and handle plan subscription if needed
    const user = await prisma.$transaction(async (tx) => {
        // 1. Update basic user data
        const updatedUser = await tx.user.update({
            where: { id },
            data,
        });

        // 2. Handle Plan Update (Only if plan is provided and user is Admin)
        console.log('[USER UPDATE] Plan data received:', { plan, planStatus, requestingUserRole, userId: id });
        
        if (plan && requestingUserRole === 'ADMIN') {
            // Normalize plan name to title case (PRO -> Pro, ESSENTIAL -> Essential, PREMIUM -> Premium)
            const normalizedPlan = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
            console.log('[USER UPDATE] Normalized plan:', normalizedPlan);
            
            // Find or create the plan
            let planRecord = await tx.plan.findFirst({
                where: { 
                    name: { equals: normalizedPlan, mode: 'insensitive' }
                }
            });

            // If plan doesn't exist, create it (for Essential, Pro, Premium)
            if (!planRecord) {
                const planDefaults: Record<string, { price: number; features: string[] }> = {
                    'Essential': { price: 0, features: ['Recursos básicos'] },
                    'Pro': { price: 89.90, features: ['Assistente IA LIAMED', 'Transcrições Ilimitadas', 'Calculadoras Médicas', 'Suporte Prioritário'] },
                    'Premium': { price: 149.90, features: ['Todos os recursos Pro', 'Suporte VIP', 'Acesso ilimitado'] }
                };
                
                const defaults = planDefaults[normalizedPlan] || { price: 0, features: [] };
                
                planRecord = await tx.plan.create({
                    data: {
                        name: normalizedPlan,
                        description: `Plano ${normalizedPlan}`,
                        price: defaults.price,
                        interval: 'MONTHLY',
                        features: defaults.features,
                        active: true
                    }
                });
            }

            // Deactivate user's existing active subscriptions
            await tx.subscription.updateMany({
                where: { userId: id, status: { in: ['ACTIVE', 'TRIALING'] } },
                data: { status: 'CANCELED' }
            });

            // Create new subscription
            const newStatus = planStatus || 'ACTIVE';
            
            // Calculate dates
            const startDate = new Date();
            const endDate = new Date();
            
            if (newStatus === 'ACTIVE') {
               endDate.setFullYear(endDate.getFullYear() + 1);
            } else if (newStatus === 'TRIALING') {
               endDate.setDate(endDate.getDate() + 15);
            }

            const newSubscription = await tx.subscription.create({
                data: {
                    userId: id,
                    planId: planRecord.id,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    status: newStatus as any,
                    currentPeriodStart: startDate,
                    currentPeriodEnd: endDate,
                    stripeSubscriptionId: 'manual_admin_override_' + Date.now()
                }
            });
            console.log('[USER UPDATE] ✅ Subscription created:', { subscriptionId: newSubscription.id, planId: planRecord.id, status: newStatus });
        }

        return updatedUser;
    });

    // Audit Log
    await logAction({
      userId: req.user.id,
      userName: req.user.name || "Unknown",
      action: "UPDATE",
      resource: "USER",
      resourceId: id,
      details: { updatedFields: Object.keys(data), planUpdate: plan },
      req,
    });

    res.json(user);
  } catch (error) {
    console.error("Update User Error: ", error);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    let userId = req.user.id;
    const targetId = req.params.id;

    if (targetId) {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado." });
      }
      userId = targetId;
    }

    // LGPD: Right to be Forgotten - Manual Cascade Delete
    // We must delete/anonymize all related data that doesn't cascade automatically
    await prisma.$transaction(async (tx) => {
        // 1. Delete Dependencies (Manual Cascade)
        await tx.auditLog.deleteMany({ where: { userId } });
        await tx.notification.deleteMany({ where: { userId } });
        await tx.subscription.deleteMany({ where: { userId } });
        await tx.supportTicket.deleteMany({ where: { userId } });
        await tx.supportMessage.deleteMany({ where: { senderId: userId } });
        await tx.calculationHistory.deleteMany({ where: { userId } });
        
        // 2. Delete User (Doctor/Consult/Diagnosis cascade handled by Schema)
        await tx.user.delete({
            where: { id: userId },
        });
    });

    // Audit Log (Post-deletion using a system account or general log?)
    // Since user is gone, we can't link it. We just log to console or a system-wide log if exists.
    // For now, we skip DB audit or use a 'SYSTEM' ID if available.
    console.log(`[AUDIT] User ${userId} deleted (Right to be Forgotten executed)`);

    res.json({ message: "Conta e dados associados excluídos com sucesso (LGPD)." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
};

// Debug endpoint to check user subscriptions
export const getUserSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Only admin can check other users' subscriptions
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Calculate current active plan
    const activeSubscription = user.subscriptions.find(s => 
      s.status === 'ACTIVE' || s.status === 'TRIALING'
    );

    res.json({
      userId: user.id,
      userName: user.name,
      email: user.email,
      currentPlan: activeSubscription?.plan?.name || 'NENHUM',
      currentPlanStatus: activeSubscription?.status || 'N/A',
      subscriptions: user.subscriptions.map(s => ({
        id: s.id,
        planName: s.plan?.name,
        status: s.status,
        createdAt: s.createdAt,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd
      })),
      totalSubscriptions: user.subscriptions.length
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ error: "Erro ao buscar assinaturas." });
  }
};

interface AuthRequest extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    // Fetch user with subscriptions to determine plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        biography: true,
        status: true,
        endpointId: true,
        createdAt: true,
        lastLogin: true,
        notifyVagasWhatsApp: true,
        notifyVagasEmail: true,
        specialty: true,
        termsAcceptedAt: true,
        subscriptions: {
            // where: { status: { in: ['ACTIVE', 'TRIALING'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Determine plan
    let plan = 'ESSENTIAL';
    let planStatus = 'ACTIVE';

    if (user.subscriptions && user.subscriptions.length > 0) {
        const sub = user.subscriptions[0];
        // Normalize plan name to uppercase (Essential -> ESSENTIAL)
        if (sub.plan) {
            plan = sub.plan.name.toUpperCase();
        }
        planStatus = sub.status;
    } else {
        // No subscription record at all -> Default to Essential Active (Free Tier)
        // OR should we treat as 'NO_PLAN'?
        // For now, let's assume if they have NO history, they are free tier.
        plan = 'ESSENTIAL';
        planStatus = 'ACTIVE';
    }

    // Return flattened user object with plan info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subscriptions, ...userData } = user;
    
    res.json({
        ...userData,
        plan,
        planStatus,
        planEndsAt: user.subscriptions[0]?.currentPeriodEnd || null
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Erro ao buscar perfil." });
  }
};

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user.role;
    let whereClause = {};

    // Se não for ADMIN, mostra apenas médicos (ou limpa a lista se for para isolar totalmente)
    // Por enquanto, vamos permitir que médicos vejam outros médicos para fins de encaminhamento,
    // mas idealmente isso seria restrito.
    // Se a regra for "Separação por Usuário" estrita, talvez o médico só veja ele mesmo?
    // Vamos manter visibilidade geral apenas para ADMIN por segurança.

    if (userRole !== "ADMIN") {
      if (userRole === "GESTOR") {
        // GESTOR sees everyone in their clinic
        if (req.user.clinicId) {
            console.log(`[USER LIST] Gestor ${req.user.name} listing users for clinic: ${req.user.clinicId}`);
            whereClause = { clinicId: req.user.clinicId };
        } else {
            // Gestor without clinic sees no one (or self?)
            whereClause = { id: req.user.id };
        }
      } else {
        // MEDICO/others see only themselves
        whereClause = { id: req.user.id };
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        specialty: true,
        endpointId: true,
        customPrompt: true,
        lastLogin: true,
        subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIALING'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true }
        }
      },
      orderBy: { name: "asc" },
    });

    // Flatten results to include plan info
    const usersWithPlan = users.map(user => {
        let plan = 'Essential';
        let planStatus = 'ACTIVE';

        if (user.subscriptions && user.subscriptions.length > 0) {
            const sub = user.subscriptions[0];
            if (sub.plan) {
                // Normalize to Title Case (e.g. Pro, Premium)
                plan = sub.plan.name.charAt(0).toUpperCase() + sub.plan.name.slice(1).toLowerCase();
            }
            planStatus = sub.status;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { subscriptions, ...userData } = user;
        const activeSub = user.subscriptions && user.subscriptions.length > 0 ? user.subscriptions[0] : null;

        return {
            ...userData,
            plan,
            planStatus,
            planEndsAt: activeSub ? activeSub.currentPeriodEnd : null
        };
    });

    res.json(usersWithPlan);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
};

// Accept Terms of Service
export const acceptTerms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { termsAcceptedAt: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        termsAcceptedAt: true,
      },
    });

    // Audit Log
    await logAction({
      userId: userId,
      userName: req.user?.name || "Unknown",
      action: "UPDATE",
      resource: "TERMS_ACCEPTANCE",
      resourceId: userId,
      details: { acceptedAt: user.termsAcceptedAt },
      req,
    });

    res.json({ 
      message: "Termos aceitos com sucesso.",
      termsAcceptedAt: user.termsAcceptedAt 
    });
  } catch (error) {
    console.error("Error accepting terms:", error);
    res.status(500).json({ error: "Erro ao aceitar termos." });
  }
};
