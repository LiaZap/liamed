import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createFormula(data: any) {
    const exists = await prisma.calculatorFormula.findFirst({
        where: { name: data.name }
    });

    if (!exists) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await prisma.calculatorFormula.create({ data });
        console.log(`✅ Created: ${data.name}`);
    } else {
        console.log(`ℹ️ Skipped (already exists): ${data.name}`);
    }
}

async function main() {
    console.log('Seeding Calculators (Safe Mode)...');

    // 1. BMI
    await createFormula({
        name: 'Índice de Massa Corporal (IMC)',
        description: 'Avaliação do estado nutricional baseado em peso e altura.',
        category: 'Geral',
        expression: 'weight / (height * height)',
        variables: {
            create: [
                { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                { name: 'height', label: 'Altura', unit: 'm', type: 'NUMBER' }
            ]
        }
    });

    // 2. Creatinine Clearance (Cockcroft-Gault)
    await createFormula({
        name: 'Depuração de Creatinina (Cockcroft-Gault)',
        description: 'Estimativa da taxa de filtração glomerular renal.',
        category: 'Nefrologia',
        expression: '((140 - age) * weight * gender) / (72 * creatinine)',
        variables: {
            create: [
                { name: 'age', label: 'Idade', unit: 'anos', type: 'NUMBER' },
                { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                { name: 'creatinine', label: 'Creatinina Sérica', unit: 'mg/dL', type: 'NUMBER' },
                {
                    name: 'gender',
                    label: 'Sexo',
                    type: 'SELECT',
                    options: [
                        { label: "Masculino", value: 1 },
                        { label: "Feminino", value: 0.85 }
                    ]
                }
            ]
        }
    });

    // 3. Score CHA2DS2-VASc
    await createFormula({
        name: 'Score CHA₂DS₂-VASc (Risco AVC)',
        description: 'Estratificação de risco para AVC em Fibrilação Atrial.',
        category: 'Cardiologia',
        expression: 'age_score + sex_score + chf + hypertension + stroke + vascular + diabetes',
        variables: {
            create: [
                {
                    name: 'age_score', label: 'Idade', type: 'SELECT',
                    options: [{ label: "< 65 anos", value: 0 }, { label: "65-74 anos", value: 1 }, { label: "≥ 75 anos", value: 2 }]
                },
                {
                    name: 'sex_score', label: 'Sexo', type: 'SELECT',
                    options: [{ label: "Masculino", value: 0 }, { label: "Feminino", value: 1 }]
                },
                { name: 'chf', label: 'Insuficiência Cardíaca', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] },
                { name: 'hypertension', label: 'Hipertensão', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] },
                { name: 'stroke', label: 'AVC/AIT Prévio', type: 'BOOLEAN', options: [{ label: "Sim", value: 2 }, { label: "Não", value: 0 }] },
                { name: 'vascular', label: 'Doença Vascular', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] },
                { name: 'diabetes', label: 'Diabetes', type: 'BOOLEAN', options: [{ label: "Sim", value: 1 }, { label: "Não", value: 0 }] }
            ]
        }
    });

    // 4. LDL Friedewald
    await createFormula({
        name: 'LDL Colesterol (Friedewald)',
        description: 'Cálculo do LDL quando triglicerídeos < 400 mg/dL.',
        category: 'Cardiologia',
        expression: 'ct - hdl - (trig / 5)',
        variables: {
            create: [
                { name: 'ct', label: 'Colesterol Total', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'hdl', label: 'HDL Colesterol', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'trig', label: 'Triglicerídeos', unit: 'mg/dL', type: 'NUMBER' }
            ]
        }
    });

    // 5. Glasgow Coma Scale
    await createFormula({
        name: 'Escala de Coma de Glasgow',
        description: 'Avaliação do nível de consciência após trauma.',
        category: 'Emergência',
        expression: 'eye + verbal + motor',
        variables: {
            create: [
                {
                    name: 'eye', label: 'Abertura Ocular', type: 'SELECT',
                    options: [
                        { label: "Espontânea (4)", value: 4 },
                        { label: "Ao comando verbal (3)", value: 3 },
                        { label: "À dor (2)", value: 2 },
                        { label: "Ausente (1)", value: 1 }
                    ]
                },
                {
                    name: 'verbal', label: 'Resposta Verbal', type: 'SELECT',
                    options: [
                        { label: "Orientado (5)", value: 5 },
                        { label: "Confuso (4)", value: 4 },
                        { label: "Palavras inapropriadas (3)", value: 3 },
                        { label: "Sons incompreensíveis (2)", value: 2 },
                        { label: "Ausente (1)", value: 1 }
                    ]
                },
                {
                    name: 'motor', label: 'Resposta Motora', type: 'SELECT',
                    options: [
                        { label: "Obedece comandos (6)", value: 6 },
                        { label: "Localiza dor (5)", value: 5 },
                        { label: "Movimento de retirada (4)", value: 4 },
                        { label: "Flexão anormal/Decorticação (3)", value: 3 },
                        { label: "Extensão anormal/Decerebração (2)", value: 2 },
                        { label: "Ausente (1)", value: 1 }
                    ]
                }
            ]
        }
    });

    // 6. QT Corrected (Bazett)
    await createFormula({
        name: 'QT Corrigido (Bazett)',
        description: 'Correção do intervalo QT pela frequência cardíaca.',
        category: 'Cardiologia',
        expression: 'qt / sqrt(rr)',
        variables: {
            create: [
                { name: 'qt', label: 'Intervalo QT (s)', unit: 'segundos', type: 'NUMBER' },
                { name: 'rr', label: 'Intervalo RR (s)', unit: 'segundos', type: 'NUMBER' }
            ]
        }
    });

    // 7. Anion Gap
    await createFormula({
        name: 'Anion Gap (Hiato Aniônico)',
        description: 'Utilizado no diagnóstico diferencial de acidose metabólica.',
        category: 'Medicina Interna',
        expression: 'na - (cl + hco3)',
        variables: {
            create: [
                { name: 'na', label: 'Sódio (Na+)', unit: 'mEq/L', type: 'NUMBER' },
                { name: 'cl', label: 'Cloro (Cl-)', unit: 'mEq/L', type: 'NUMBER' },
                { name: 'hco3', label: 'Bicarbonato (HCO3-)', unit: 'mEq/L', type: 'NUMBER' }
            ]
        }
    });

    console.log("Calculators seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
