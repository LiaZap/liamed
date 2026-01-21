import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ... imports
import { logAction } from "../services/audit.service";

// ... existing getProfile/listUsers

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
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

    // Security Check: Only Admin can change role or status
    if (requestingUserRole !== "ADMIN" && (role || status)) {
      return res
        .status(403)
        .json({
          error:
            "Acesso negado. Apenas administradores podem alterar funções ou status.",
        });
    }

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
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    // Remove undefined fields
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key],
    );

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // Audit Log
    await logAction({
      userId: req.user.id,
      userName: req.user.name || "Unknown",
      action: "UPDATE",
      resource: "USER",
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      req,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    // If query/params has id and user is admin, delete that user.
    // Otherwise delete self.

    let userId = req.user.id;
    const targetId = req.params.id;

    if (targetId) {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado." });
      }
      userId = targetId;
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    // Audit Log
    await logAction({
      userId: req.user.id,
      userName: req.user.name || "Unknown",
      action: "DELETE",
      resource: "USER",
      resourceId: userId,
      req,
    });

    res.json({ message: "Conta excluída com sucesso." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
};

interface AuthRequest extends Request {
  user?: any;
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

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
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(user);
  } catch (error) {
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
      // Opção A: Ver apenas a si mesmo
      whereClause = { id: req.user.id };

      // Opção B: Ver apenas Pacientes (não temos Role patient, mas podemos filtrar role != ADMIN)
      // whereClause = { role: 'MEDICO' };
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
      },
      orderBy: { name: "asc" },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
};
