import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const calculatorController = {
    // List all available calculator formulas
    listFormulas: async (req: Request, res: Response) => {
        try {
            const formulas = await prisma.calculatorFormula.findMany({
                include: {
                    variables: true
                }
            });
            res.json(formulas);
        } catch (error) {
            console.error('Error listing formulas:', error);
            res.status(500).json({ error: 'Failed to list formulas' });
        }
    },

    // Calculate a result (stateless or safe logic)
    // NOTE: In a real prod environment, use 'mathjs' for safe evaluation.
    // Here we use a restricted Function evaluation for demonstration.
    calculate: async (req: Request, res: Response) => {
        try {
            const { formulaId, inputs } = req.body;
            const userId = (req as any).user?.id;

            const formula = await prisma.calculatorFormula.findUnique({
                where: { id: formulaId },
                include: { variables: true }
            });

            if (!formula) {
                return res.status(404).json({ error: 'Formula not found' });
            }

            // Validate inputs
            const safeInputs: Record<string, number> = {};
            for (const variable of formula.variables) {
                const val = inputs[variable.name];
                if (val === undefined || val === null || isNaN(Number(val))) {
                    return res.status(400).json({ error: `Missing or invalid input for variable: ${variable.label}` });
                }
                safeInputs[variable.name] = Number(val);
            }

            // Evaluate Expression safely-ish
            // expression example: "weight / (height * height)"
            const keys = Object.keys(safeInputs);
            const values = Object.values(safeInputs);

            // Create a function that takes the variable names as arguments and returns the result
            const evaluate = new Function(...keys, `return ${formula.expression};`);

            let result: number;
            try {
                result = evaluate(...values);
            } catch (evalError) {
                console.error('Expr eval error', evalError);
                return res.status(400).json({ error: 'Error calculating formula' });
            }

            // Save history if user is authenticated
            if (userId) {
                await prisma.calculationHistory.create({
                    data: {
                        userId,
                        formulaId,
                        inputs: safeInputs as any,
                        result
                    }
                });
            }

            res.json({ result });
        } catch (error) {
            console.error('Error calculating:', error);
            res.status(500).json({ error: 'Failed to perform calculation' });
        }
    },

    // Get History for User
    getHistory: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const history = await prisma.calculationHistory.findMany({
                where: { userId },
                include: { formula: true },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            res.json(history);
        } catch (error) {
            console.error('Error fetching history:', error);
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    }
};
