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
                },
                {
                    name: 'Análise de Gasometria Arterial',
                    description: 'Análise completa de distúrbios ácido-base com interpretação clínica automática.',
                    category: 'Medicina Interna',
                    expression: 'gasometry_special',
                    variables: [
                        { name: 'ph', label: 'pH arterial', unit: '', type: 'NUMBER' },
                        { name: 'pco2', label: 'pCO₂', unit: 'mmHg', type: 'NUMBER' },
                        { name: 'hco3', label: 'HCO₃⁻', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'na', label: 'Sódio (Na⁺)', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'cl', label: 'Cloro (Cl⁻)', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'albumin', label: 'Albumina', unit: 'g/dL', type: 'NUMBER' }
                    ]
                }
            ];

            let count = 0;
            for (const data of formulas) {
                const exists = await prisma.calculatorFormula.findFirst({ where: { name: data.name } });
                if (!exists) {
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
    },

    // Advanced Gasometry Analysis with clinical interpretation
    analyzeGasometry: async (req: Request, res: Response) => {
        try {
            const { ph, pco2, hco3, na, cl, albumin } = req.body;
            const userId = (req as any).user?.id;

            // Validate inputs
            if ([ph, pco2, hco3, na, cl, albumin].some(v => v === undefined || isNaN(Number(v)))) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const phVal = Number(ph);
            const pco2Val = Number(pco2);
            const hco3Val = Number(hco3);
            const naVal = Number(na);
            const clVal = Number(cl);
            const albuminVal = Number(albumin);

            // Reference values
            const REF = {
                ph: { min: 7.35, max: 7.45 },
                pco2: { min: 35, max: 45, normal: 40 },
                hco3: { min: 22, max: 26, normal: 24 },
                anionGap: { normal: 12 }
            };

            // Calculate Anion Gap with albumin correction
            const anionGap = naVal - (clVal + hco3Val);
            const agCorrected = anionGap + 2.5 * (4 - albuminVal);

            // Determine primary disorder
            let primaryDisorder = '';
            let disorderType = '';
            let severity = '';

            if (phVal < REF.ph.min) {
                primaryDisorder = 'Acidemia';
                if (pco2Val > REF.pco2.max && hco3Val >= REF.hco3.min) {
                    disorderType = 'Acidose Respiratória';
                } else if (hco3Val < REF.hco3.min) {
                    disorderType = 'Acidose Metabólica';
                } else {
                    disorderType = 'Acidose Mista';
                }
                severity = phVal < 7.20 ? 'Grave' : phVal < 7.30 ? 'Moderada' : 'Leve';
            } else if (phVal > REF.ph.max) {
                primaryDisorder = 'Alcalemia';
                if (pco2Val < REF.pco2.min && hco3Val <= REF.hco3.max) {
                    disorderType = 'Alcalose Respiratória';
                } else if (hco3Val > REF.hco3.max) {
                    disorderType = 'Alcalose Metabólica';
                } else {
                    disorderType = 'Alcalose Mista';
                }
                severity = phVal > 7.55 ? 'Grave' : phVal > 7.50 ? 'Moderada' : 'Leve';
            } else {
                primaryDisorder = 'pH Normal';
                // Check for compensated disorders
                if (pco2Val < REF.pco2.min && hco3Val < REF.hco3.min) {
                    disorderType = 'Alcalose Respiratória Compensada ou Acidose Metabólica Compensada';
                } else if (pco2Val > REF.pco2.max && hco3Val > REF.hco3.max) {
                    disorderType = 'Acidose Respiratória Compensada ou Alcalose Metabólica Compensada';
                } else {
                    disorderType = 'Equilíbrio Ácido-Base Normal';
                }
                severity = 'N/A';
            }

            // Calculate expected compensation
            let expectedCompensation = '';
            let compensationStatus = '';
            
            if (disorderType === 'Acidose Metabólica') {
                // Winter's formula: Expected pCO2 = 1.5 × [HCO3-] + 8 ± 2
                const expectedPco2 = 1.5 * hco3Val + 8;
                const minExpected = expectedPco2 - 2;
                const maxExpected = expectedPco2 + 2;
                expectedCompensation = `pCO₂ esperado: ${expectedPco2.toFixed(1)} mmHg (${minExpected.toFixed(1)} - ${maxExpected.toFixed(1)})`;
                
                if (pco2Val < minExpected) {
                    compensationStatus = 'Alcalose respiratória superimposta';
                } else if (pco2Val > maxExpected) {
                    compensationStatus = 'Acidose respiratória superimposta';
                } else {
                    compensationStatus = 'Compensação respiratória adequada';
                }
            } else if (disorderType === 'Alcalose Metabólica') {
                // Expected pCO2 = 0.7 × [HCO3-] + 21 ± 2
                const expectedPco2 = 0.7 * hco3Val + 21;
                const minExpected = expectedPco2 - 2;
                const maxExpected = expectedPco2 + 2;
                expectedCompensation = `pCO₂ esperado: ${expectedPco2.toFixed(1)} mmHg (${minExpected.toFixed(1)} - ${maxExpected.toFixed(1)})`;
                
                if (pco2Val > maxExpected) {
                    compensationStatus = 'Acidose respiratória superimposta';
                } else if (pco2Val < minExpected) {
                    compensationStatus = 'Alcalose respiratória superimposta';
                } else {
                    compensationStatus = 'Compensação respiratória adequada';
                }
            } else if (disorderType === 'Acidose Respiratória') {
                // Acute: Expected HCO3 = 24 + 0.1 × (pCO2 - 40)
                // Chronic: Expected HCO3 = 24 + 0.35 × (pCO2 - 40)
                const acuteHco3 = 24 + 0.1 * (pco2Val - 40);
                const chronicHco3 = 24 + 0.35 * (pco2Val - 40);
                expectedCompensation = `HCO₃⁻ esperado (aguda): ${acuteHco3.toFixed(1)} | (crônica): ${chronicHco3.toFixed(1)} mEq/L`;
                
                if (hco3Val > chronicHco3 + 3) {
                    compensationStatus = 'Alcalose metabólica superimposta';
                } else if (hco3Val < acuteHco3 - 2) {
                    compensationStatus = 'Acidose metabólica superimposta';
                } else if (hco3Val >= acuteHco3 - 2 && hco3Val <= acuteHco3 + 2) {
                    compensationStatus = 'Acidose respiratória aguda';
                } else {
                    compensationStatus = 'Acidose respiratória crônica ou em transição';
                }
            } else if (disorderType === 'Alcalose Respiratória') {
                // Acute: Expected HCO3 = 24 - 0.2 × (40 - pCO2)
                // Chronic: Expected HCO3 = 24 - 0.5 × (40 - pCO2)
                const acuteHco3 = 24 - 0.2 * (40 - pco2Val);
                const chronicHco3 = 24 - 0.5 * (40 - pco2Val);
                expectedCompensation = `HCO₃⁻ esperado (aguda): ${acuteHco3.toFixed(1)} | (crônica): ${chronicHco3.toFixed(1)} mEq/L`;
                
                if (hco3Val < chronicHco3 - 3) {
                    compensationStatus = 'Acidose metabólica superimposta';
                } else if (hco3Val > acuteHco3 + 2) {
                    compensationStatus = 'Alcalose metabólica superimposta';
                } else if (hco3Val >= acuteHco3 - 2 && hco3Val <= acuteHco3 + 2) {
                    compensationStatus = 'Alcalose respiratória aguda';
                } else {
                    compensationStatus = 'Alcalose respiratória crônica ou em transição';
                }
            }

            // Delta Ratio for elevated AG metabolic acidosis
            let deltaRatio = null;
            let deltaRatioInterpretation = '';
            
            if (agCorrected > 14 && disorderType.includes('Acidose Metabólica')) {
                const deltaAG = agCorrected - 12;
                const deltaHCO3 = 24 - hco3Val;
                deltaRatio = deltaHCO3 > 0 ? deltaAG / deltaHCO3 : null;
                
                if (deltaRatio !== null) {
                    if (deltaRatio < 1) {
                        deltaRatioInterpretation = 'Acidose metabólica com AG elevado + Acidose metabólica hiperclorêmica';
                    } else if (deltaRatio >= 1 && deltaRatio <= 2) {
                        deltaRatioInterpretation = 'Acidose metabólica com AG elevado pura';
                    } else {
                        deltaRatioInterpretation = 'Acidose metabólica com AG elevado + Alcalose metabólica';
                    }
                }
            }

            // Anion Gap interpretation
            let agInterpretation = '';
            if (agCorrected <= 12) {
                agInterpretation = 'Anion Gap normal';
            } else if (agCorrected <= 20) {
                agInterpretation = 'Anion Gap elevado leve';
            } else {
                agInterpretation = 'Anion Gap elevado significativo';
            }

            // Possible causes based on disorder
            let possibleCauses: string[] = [];
            
            if (disorderType === 'Acidose Metabólica' && agCorrected > 14) {
                possibleCauses = ['Cetoacidose diabética', 'Acidose láctica', 'Insuficiência renal', 'Intoxicações (metanol, etilenoglicol, salicilatos)'];
            } else if (disorderType === 'Acidose Metabólica' && agCorrected <= 14) {
                possibleCauses = ['Diarreia', 'Acidose tubular renal', 'Uso de acetazolamida', 'Fístula intestinal'];
            } else if (disorderType === 'Alcalose Metabólica') {
                possibleCauses = ['Vômitos', 'Uso de diuréticos', 'Hipocalemia', 'Hiperaldosteronismo'];
            } else if (disorderType === 'Acidose Respiratória') {
                possibleCauses = ['DPOC', 'Sedação/Overdose', 'Doenças neuromusculares', 'Obstrução de via aérea'];
            } else if (disorderType === 'Alcalose Respiratória') {
                possibleCauses = ['Hiperventilação por ansiedade', 'Dor', 'Sepse', 'Embolia pulmonar', 'Hipoxemia'];
            }

            const result = {
                values: {
                    ph: phVal,
                    pco2: pco2Val,
                    hco3: hco3Val,
                    anionGap: Number(anionGap.toFixed(1)),
                    anionGapCorrected: Number(agCorrected.toFixed(1)),
                    deltaRatio: deltaRatio ? Number(deltaRatio.toFixed(2)) : null
                },
                interpretation: {
                    primaryDisorder,
                    disorderType,
                    severity,
                    compensationStatus,
                    expectedCompensation,
                    anionGapInterpretation: agInterpretation,
                    deltaRatioInterpretation: deltaRatioInterpretation || null,
                    possibleCauses
                }
            };

            // Save to history
            if (userId) {
                const formula = await prisma.calculatorFormula.findFirst({
                    where: { name: 'Análise de Gasometria Arterial' }
                });
                if (formula) {
                    await prisma.calculationHistory.create({
                        data: {
                            userId,
                            formulaId: formula.id,
                            inputs: { ph: phVal, pco2: pco2Val, hco3: hco3Val, na: naVal, cl: clVal, albumin: albuminVal } as any,
                            result: phVal // Store pH as the main result
                        }
                    });
                }
            }

            res.json(result);
        } catch (error) {
            console.error('Gasometry analysis error:', error);
            res.status(500).json({ error: 'Falha na análise de gasometria' });
        }
    }
};
