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
    },

    // Admin: Seed Calculators
    seedCalculators: async (req: Request, res: Response) => {
        try {
            // Import and run the seed logic dynamically or duplicate it here safely.
            // Since importing a script that runs "main()" automatically is tricky, 
            // we will implement the idempotent creation logic directly here for safety and portability.

            const formulas = [
                {
                    name: 'Índice de Massa Corporal (IMC)',
                    description: 'Avaliação do estado nutricional baseado em peso e altura.',
                    category: 'Geral',
                    expression: 'weight / (height * height)',
                    variables: [
                        { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                        { name: 'height', label: 'Altura', unit: 'm', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Depuração de Creatinina (Cockcroft-Gault)',
                    description: 'Estimativa da taxa de filtração glomerular renal.',
                    category: 'Nefrologia',
                    expression: '((140 - age) * weight) / (72 * creatinine) * sex',
                    variables: [
                        { name: 'age', label: 'Idade', unit: 'anos', type: 'NUMBER' },
                        { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                        { name: 'creatinine', label: 'Creatinina Sérica', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'sex', label: 'Sexo', type: 'SELECT', options: [{ label: "Masculino", value: 1 }, { label: "Feminino", value: 0.85 }] }
                    ]
                },
                {
                    name: 'Score CHA₂DS₂-VASc (Risco AVC)',
                    description: 'Estratificação de risco para AVC em Fibrilação Atrial.',
                    category: 'Cardiologia',
                    expression: 'age_score + sex_score + chf + hypertension + stroke + vascular + diabetes',
                    variables: [
                        { name: 'age_score', label: 'Idade', type: 'SELECT', options: [{ label: "< 65 anos", value: 0 }, { label: "65-74 anos", value: 1 }, { label: "≥ 75 anos", value: 2 }] },
                        { name: 'sex_score', label: 'Sexo', type: 'SELECT', options: [{ label: "Masculino", value: 0 }, { label: "Feminino", value: 1 }] },
                        { name: 'chf', label: 'Insuficiência Cardíaca', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] },
                        { name: 'hypertension', label: 'Hipertensão', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] },
                        { name: 'stroke', label: 'AVC/AIT Prévio', type: 'BOOLEAN', options: [{ label: "Sim", value: 2 }, { label: "Não", value: 0 }] },
                        { name: 'vascular', label: 'Doença Vascular', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] },
                        { name: 'diabetes', label: 'Diabetes', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] }
                    ]
                },
                {
                    name: 'LDL Colesterol (Friedewald)',
                    description: 'Cálculo do LDL quando triglicerídeos < 400 mg/dL.',
                    category: 'Cardiologia',
                    expression: 'ct - hdl - (trig / 5)',
                    variables: [
                        { name: 'ct', label: 'Colesterol Total', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'hdl', label: 'HDL Colesterol', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'trig', label: 'Triglicerídeos', unit: 'mg/dL', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Escala de Coma de Glasgow',
                    description: 'Avaliação do nível de consciência após trauma.',
                    category: 'Emergência',
                    expression: 'eye + verbal + motor',
                    variables: [
                        { name: 'eye', label: 'Abertura Ocular', type: 'SELECT', options: [{ label: "Espontânea (4)", value: 4 }, { label: "Ao comando verbal (3)", value: 3 }, { label: "À dor (2)", value: 2 }, { label: "Ausente (1)", value: 1 }] },
                        { name: 'verbal', label: 'Resposta Verbal', type: 'SELECT', options: [{ label: "Orientado (5)", value: 5 }, { label: "Confuso (4)", value: 4 }, { label: "Palavras inapropriadas (3)", value: 3 }, { label: "Sons incompreensíveis (2)", value: 2 }, { label: "Ausente (1)", value: 1 }] },
                        { name: 'motor', label: 'Resposta Motora', type: 'SELECT', options: [{ label: "Obedece comandos (6)", value: 6 }, { label: "Localiza dor (5)", value: 5 }, { label: "Movimento de retirada (4)", value: 4 }, { label: "Flexão anormal/Decorticação (3)", value: 3 }, { label: "Extensão anormal/Decerebração (2)", value: 2 }, { label: "Ausente (1)", value: 1 }] }
                    ]
                },
                {
                    name: 'QT Corrigido (Bazett)',
                    description: 'Correção do intervalo QT pela frequência cardíaca.',
                    category: 'Cardiologia',
                    expression: 'qt / Math.sqrt(rr)',
                    variables: [
                        { name: 'qt', label: 'Intervalo QT', unit: 'segundos (ex: 0.40)', type: 'NUMBER' },
                        { name: 'rr', label: 'Intervalo RR', unit: 'segundos (ex: 0.80)', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Anion Gap (Hiato Aniônico)',
                    description: 'Utilizado no diagnóstico diferencial de acidose metabólica.',
                    category: 'Medicina Interna',
                    expression: 'na - (cl + hco3)',
                    variables: [
                        { name: 'na', label: 'Sódio (Na+)', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'cl', label: 'Cloro (Cl-)', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'hco3', label: 'Bicarbonato (HCO3-)', unit: 'mEq/L', type: 'NUMBER' }
                    ]
                }
            ];

            let count = 0;
            for (const data of formulas) {
                const exists = await prisma.calculatorFormula.findFirst({ where: { name: data.name } });
                if (!exists) {
                    // @ts-ignore
                    await prisma.calculatorFormula.create({
                        data: {
                            name: data.name,
                            description: data.description,
                            category: data.category,
                            expression: data.expression,
                            variables: {
                                create: data.variables.map((v: any) => ({
                                    name: v.name,
                                    label: v.label,
                                    unit: v.unit,
                                    type: v.type, // ENUM mapping might be needed if not matching exactly, but strings usually work if valid
                                    options: v.options
                                }))
                            }
                        }
                    });
                    count++;
                }
            }

            res.json({ message: `Calculators seeded successfully. Added ${count} new formulas.` });
        } catch (error) {
            console.error('Seed error:', error);
            res.status(500).json({ error: 'Failed to seed calculators' });
        }
    }
};
