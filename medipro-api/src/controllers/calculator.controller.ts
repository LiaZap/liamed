import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (req as any).user?.id;

            const formula = await prisma.calculatorFormula.findUnique({
                where: { id: formulaId },
                include: { variables: true }
            });

            if (!formula) {
                return res.status(404).json({ error: 'Formula not found' });
            }

            // Validate inputs (normalize comma to period for decimal separator)
            const safeInputs: Record<string, number> = {};
            for (const variable of formula.variables) {
                const rawVal = inputs[variable.name];
                if (rawVal === undefined || rawVal === null) {
                    return res.status(400).json({ error: `Missing or invalid input for variable: ${variable.label}` });
                }
                const normalizedVal = Number(String(rawVal).replace(',', '.'));
                if (isNaN(normalizedVal)) {
                    return res.status(400).json({ error: `Missing or invalid input for variable: ${variable.label}` });
                }
                safeInputs[variable.name] = normalizedVal;
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                },
                // ===== NOVAS CALCULADORAS =====
                {
                    name: 'NEWS2 (National Early Warning Score)',
                    description: 'Score de alerta precoce para deterioração clínica.',
                    category: 'Emergência',
                    expression: 'resp + spo2 + supp_o2 + temp + pas + fc + neuro',
                    variables: [
                        { name: 'resp', label: 'Frequência Respiratória', type: 'SELECT', options: [{ label: '≤8 (3pt)', value: 3 }, { label: '9-11 (1pt)', value: 1 }, { label: '12-20 (0pt)', value: 0 }, { label: '21-24 (2pt)', value: 2 }, { label: '≥25 (3pt)', value: 3 }] },
                        { name: 'spo2', label: 'SpO₂', type: 'SELECT', options: [{ label: '≤91% (3pt)', value: 3 }, { label: '92-93% (2pt)', value: 2 }, { label: '94-95% (1pt)', value: 1 }, { label: '≥96% (0pt)', value: 0 }] },
                        { name: 'supp_o2', label: 'O₂ Suplementar', type: 'SELECT', options: [{ label: 'Sim (2pt)', value: 2 }, { label: 'Não (0pt)', value: 0 }] },
                        { name: 'temp', label: 'Temperatura', type: 'SELECT', options: [{ label: '≤35.0°C (3pt)', value: 3 }, { label: '35.1-36.0°C (1pt)', value: 1 }, { label: '36.1-38.0°C (0pt)', value: 0 }, { label: '38.1-39.0°C (1pt)', value: 1 }, { label: '≥39.1°C (2pt)', value: 2 }] },
                        { name: 'pas', label: 'Pressão Arterial Sistólica', type: 'SELECT', options: [{ label: '≤90 (3pt)', value: 3 }, { label: '91-100 (2pt)', value: 2 }, { label: '101-110 (1pt)', value: 1 }, { label: '111-219 (0pt)', value: 0 }, { label: '≥220 (3pt)', value: 3 }] },
                        { name: 'fc', label: 'Frequência Cardíaca', type: 'SELECT', options: [{ label: '≤40 (3pt)', value: 3 }, { label: '41-50 (1pt)', value: 1 }, { label: '51-90 (0pt)', value: 0 }, { label: '91-110 (1pt)', value: 1 }, { label: '111-130 (2pt)', value: 2 }, { label: '≥131 (3pt)', value: 3 }] },
                        { name: 'neuro', label: 'Nível Consciência (AVPU)', type: 'SELECT', options: [{ label: 'Alerta (0pt)', value: 0 }, { label: 'Responde Voz (3pt)', value: 3 }, { label: 'Responde Dor (3pt)', value: 3 }, { label: 'Não Responsivo (3pt)', value: 3 }] }
                    ]
                },
                {
                    name: 'CURB-65 (Pneumonia)',
                    description: 'Estratificação de gravidade em pneumonia adquirida na comunidade.',
                    category: 'Pneumologia',
                    expression: 'confusion + ureia + fr + pa + age',
                    variables: [
                        { name: 'confusion', label: 'Confusão Mental', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não (0pt)', value: 0 }] },
                        { name: 'ureia', label: 'Ureia > 50 mg/dL', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não (0pt)', value: 0 }] },
                        { name: 'fr', label: 'FR ≥ 30 irpm', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não (0pt)', value: 0 }] },
                        { name: 'pa', label: 'PAS < 90 ou PAD ≤ 60', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não (0pt)', value: 0 }] },
                        { name: 'age', label: 'Idade ≥ 65 anos', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não (0pt)', value: 0 }] }
                    ]
                },
                {
                    name: 'Wells Score (TVP)',
                    description: 'Probabilidade clínica de Trombose Venosa Profunda.',
                    category: 'Vascular',
                    expression: 'cancer + paralysis + bedridden + tenderness + swelling + asymmetry + edema + collateral + previous + alternative',
                    variables: [
                        { name: 'cancer', label: 'Câncer ativo (em tto ou últimos 6m)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'paralysis', label: 'Paralisia/paresia de MMII', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'bedridden', label: 'Acamado > 3 dias ou cirurgia < 12 sem', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'tenderness', label: 'Dor à palpação do trajeto venoso', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'swelling', label: 'Edema em toda perna', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'asymmetry', label: 'Panturrilha > 3cm maior (10cm abaixo da tuberosidade)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'edema', label: 'Edema com cacifo (apenas perna sintomática)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'collateral', label: 'Veias superficiais colaterais (não varicosas)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'previous', label: 'TVP prévia documentada', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'alternative', label: 'Diagnóstico alternativo tão ou mais provável', type: 'SELECT', options: [{ label: 'Sim (-2pt)', value: -2 }, { label: 'Não', value: 0 }] }
                    ]
                },
                {
                    name: 'Wells Score (TEP)',
                    description: 'Probabilidade clínica de Tromboembolismo Pulmonar.',
                    category: 'Pneumologia',
                    expression: 'dvt_signs + alternative + fc + immobilization + previous_vte + hemoptysis + cancer',
                    variables: [
                        { name: 'dvt_signs', label: 'Sinais clínicos de TVP', type: 'SELECT', options: [{ label: 'Sim (3pt)', value: 3 }, { label: 'Não', value: 0 }] },
                        { name: 'alternative', label: 'Diagnóstico alternativo menos provável que TEP', type: 'SELECT', options: [{ label: 'Sim (3pt)', value: 3 }, { label: 'Não', value: 0 }] },
                        { name: 'fc', label: 'FC > 100 bpm', type: 'SELECT', options: [{ label: 'Sim (1.5pt)', value: 1.5 }, { label: 'Não', value: 0 }] },
                        { name: 'immobilization', label: 'Imobilização > 3 dias ou cirurgia < 4 sem', type: 'SELECT', options: [{ label: 'Sim (1.5pt)', value: 1.5 }, { label: 'Não', value: 0 }] },
                        { name: 'previous_vte', label: 'TVP/TEP prévio', type: 'SELECT', options: [{ label: 'Sim (1.5pt)', value: 1.5 }, { label: 'Não', value: 0 }] },
                        { name: 'hemoptysis', label: 'Hemoptise', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'cancer', label: 'Câncer (em tto ou últimos 6m)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] }
                    ]
                },
                {
                    name: 'MELD Score (Hepatologia)',
                    description: 'Model for End-Stage Liver Disease - prognóstico em cirrose.',
                    category: 'Hepatologia',
                    expression: '10 * (0.957 * Math.log(creatinine) + 0.378 * Math.log(bilirubin) + 1.12 * Math.log(inr) + 0.643)',
                    variables: [
                        { name: 'creatinine', label: 'Creatinina', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'bilirubin', label: 'Bilirrubina Total', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'inr', label: 'INR', unit: '', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'HAS-BLED (Risco de Sangramento)',
                    description: 'Risco de sangramento maior em pacientes anticoagulados.',
                    category: 'Cardiologia',
                    expression: 'hypertension + renal + liver + stroke + bleeding + labile + age + drugs + alcohol',
                    variables: [
                        { name: 'hypertension', label: 'Hipertensão (PAS > 160)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'renal', label: 'Insuficiência Renal (diálise, Cr>2.6)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'liver', label: 'Insuficiência Hepática', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'stroke', label: 'AVC prévio', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'bleeding', label: 'História de sangramento', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'labile', label: 'INR lábil (< 60% no alvo)', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'age', label: 'Idade > 65 anos', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'drugs', label: 'Uso de AINEs/antiplaquetários', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] },
                        { name: 'alcohol', label: 'Uso abusivo de álcool', type: 'SELECT', options: [{ label: 'Sim (1pt)', value: 1 }, { label: 'Não', value: 0 }] }
                    ]
                },
                {
                    name: 'Correção de Sódio (Hiperglicemia)',
                    description: 'Correção do sódio sérico para hiperglicemia.',
                    category: 'Emergência',
                    expression: 'na + 0.016 * (glucose - 100)',
                    variables: [
                        { name: 'na', label: 'Sódio Sérico', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'glucose', label: 'Glicemia', unit: 'mg/dL', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Cálcio Corrigido (Albumina)',
                    description: 'Correção do cálcio sérico para hipoalbuminemia.',
                    category: 'Medicina Interna',
                    expression: 'calcium + 0.8 * (4 - albumin)',
                    variables: [
                        { name: 'calcium', label: 'Cálcio Sérico', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'albumin', label: 'Albumina', unit: 'g/dL', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'MDRD (TFG Estimada)',
                    description: 'Estimativa da Taxa de Filtração Glomerular pela fórmula MDRD.',
                    category: 'Nefrologia',
                    expression: '175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203) * sex_factor * race_factor',
                    variables: [
                        { name: 'creatinine', label: 'Creatinina', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'age', label: 'Idade', unit: 'anos', type: 'NUMBER' },
                        { name: 'sex_factor', label: 'Sexo', type: 'SELECT', options: [{ label: 'Masculino', value: 1 }, { label: 'Feminino', value: 0.742 }] },
                        { name: 'race_factor', label: 'Raça Negra', type: 'SELECT', options: [{ label: 'Sim', value: 1.212 }, { label: 'Não', value: 1 }] }
                    ]
                },
                {
                    name: 'Dose Pediátrica por Peso',
                    description: 'Cálculo de dose de medicamento por peso corporal.',
                    category: 'Pediatria',
                    expression: 'weight * dose_per_kg',
                    variables: [
                        { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                        { name: 'dose_per_kg', label: 'Dose por kg', unit: 'mg/kg', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Osmolaridade Sérica',
                    description: 'Cálculo da osmolaridade sérica.',
                    category: 'Emergência',
                    expression: '2 * na + glucose / 18 + bun / 2.8',
                    variables: [
                        { name: 'na', label: 'Sódio', unit: 'mEq/L', type: 'NUMBER' },
                        { name: 'glucose', label: 'Glicose', unit: 'mg/dL', type: 'NUMBER' },
                        { name: 'bun', label: 'Ureia (BUN)', unit: 'mg/dL', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Déficit de Bicarbonato',
                    description: 'Quantidade de bicarbonato a repor em acidose metabólica.',
                    category: 'Emergência',
                    expression: '0.3 * weight * (24 - hco3)',
                    variables: [
                        { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                        { name: 'hco3', label: 'HCO3 atual', unit: 'mEq/L', type: 'NUMBER' }
                    ]
                },
                // ===== CALCULADORAS NEONATAIS =====
                {
                    name: 'APGAR Score',
                    description: 'Avaliação da vitalidade do recém-nascido ao nascer (1, 5 e 10 minutos).',
                    category: 'Neonatologia',
                    expression: 'cor + fc + reflexo + tonus + respiracao',
                    variables: [
                        { name: 'cor', label: 'Cor da Pele', unit: '', type: 'SELECT', options: JSON.stringify([{ value: 0, label: 'Azul/Pálido' }, { value: 1, label: 'Cianose periférica' }, { value: 2, label: 'Rosado' }]) },
                        { name: 'fc', label: 'Frequência Cardíaca', unit: '', type: 'SELECT', options: JSON.stringify([{ value: 0, label: 'Ausente' }, { value: 1, label: '< 100 bpm' }, { value: 2, label: '>= 100 bpm' }]) },
                        { name: 'reflexo', label: 'Irritabilidade Reflexa', unit: '', type: 'SELECT', options: JSON.stringify([{ value: 0, label: 'Ausente' }, { value: 1, label: 'Careta' }, { value: 2, label: 'Choro/Tosse' }]) },
                        { name: 'tonus', label: 'Tônus Muscular', unit: '', type: 'SELECT', options: JSON.stringify([{ value: 0, label: 'Flácido' }, { value: 1, label: 'Alguma flexão' }, { value: 2, label: 'Movimento ativo' }]) },
                        { name: 'respiracao', label: 'Respiração', unit: '', type: 'SELECT', options: JSON.stringify([{ value: 0, label: 'Ausente' }, { value: 1, label: 'Lenta/Irregular' }, { value: 2, label: 'Choro forte' }]) }
                    ]
                },
                {
                    name: 'Peso RN por Idade Gestacional',
                    description: 'Classifica o peso do recém-nascido (PIG, AIG, GIG) conforme idade gestacional.',
                    category: 'Neonatologia',
                    expression: 'neonatal_weight_percentile',
                    variables: [
                        { name: 'ig', label: 'Idade Gestacional', unit: 'semanas', type: 'NUMBER' },
                        { name: 'peso_rn', label: 'Peso ao Nascer', unit: 'gramas', type: 'NUMBER' },
                        { name: 'sexo', label: 'Sexo', unit: '', type: 'SELECT', options: JSON.stringify([{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' }]) }
                    ]
                },
                {
                    name: 'Idade Gestacional Corrigida',
                    description: 'Calcula a idade corrigida para prematuros até 2 anos.',
                    category: 'Neonatologia',
                    expression: 'idade_cronologica - ((40 - ig_nascimento) * 7)',
                    variables: [
                        { name: 'ig_nascimento', label: 'IG ao Nascer', unit: 'semanas', type: 'NUMBER' },
                        { name: 'idade_cronologica', label: 'Idade Cronológica', unit: 'dias', type: 'NUMBER' }
                    ]
                },
                // ===== CALCULADORAS DE DOSAGEM =====
                {
                    name: 'Dosagem por Peso Corporal',
                    description: 'Calcula a dose de medicamento baseada no peso do paciente.',
                    category: 'Farmacologia',
                    expression: 'dose_kg * peso',
                    variables: [
                        { name: 'dose_kg', label: 'Dose por kg', unit: 'mg/kg', type: 'NUMBER' },
                        { name: 'peso', label: 'Peso do Paciente', unit: 'kg', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Dosagem por Superfície Corporal (BSA)',
                    description: 'Calcula a dose baseada na área de superfície corporal (Fórmula de Mosteller).',
                    category: 'Farmacologia',
                    expression: 'dose_m2 * Math.sqrt((altura * peso) / 3600)',
                    variables: [
                        { name: 'dose_m2', label: 'Dose por m²', unit: 'mg/m²', type: 'NUMBER' },
                        { name: 'altura', label: 'Altura', unit: 'cm', type: 'NUMBER' },
                        { name: 'peso', label: 'Peso', unit: 'kg', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Taxa de Infusão IV',
                    description: 'Calcula a velocidade de infusão em mL/h ou gotas/min.',
                    category: 'Farmacologia',
                    expression: 'volume / tempo_h',
                    variables: [
                        { name: 'volume', label: 'Volume Total', unit: 'mL', type: 'NUMBER' },
                        { name: 'tempo_h', label: 'Tempo de Infusão', unit: 'horas', type: 'NUMBER' }
                    ]
                },
                {
                    name: 'Diluição de Medicamentos',
                    description: 'Calcula o volume final após diluição (C1V1 = C2V2).',
                    category: 'Farmacologia',
                    expression: '(c1 * v1) / c2',
                    variables: [
                        { name: 'c1', label: 'Concentração Inicial', unit: 'mg/mL', type: 'NUMBER' },
                        { name: 'v1', label: 'Volume Inicial', unit: 'mL', type: 'NUMBER' },
                        { name: 'c2', label: 'Concentração Desejada', unit: 'mg/mL', type: 'NUMBER' }
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
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userId = (req as any).user?.id;

            // Normalize comma to period for decimal separator
            const normalize = (v: unknown) => Number(String(v).replace(',', '.'));

            // Validate inputs
            if ([ph, pco2, hco3, na, cl, albumin].some(v => v === undefined || isNaN(normalize(v)))) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const phVal = normalize(ph);
            const pco2Val = normalize(pco2);
            const hco3Val = normalize(hco3);
            const naVal = normalize(na);
            const clVal = normalize(cl);
            const albuminVal = normalize(albumin);

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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
