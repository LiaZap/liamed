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
        // Update to ensure formulas are always up to date even if they exist
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await prisma.calculatorFormula.update({
            where: { id: exists.id },
            data: {
                ...data,
                variables: undefined // Don't try to update variables as nested in simple update
            }
        });
        console.log(`ℹ️ Updated: ${data.name}`);
    }
}

async function main() {
    console.log('🚀 Seeding Professional Calculators (Full Suite)...');

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

    // 3. Déficit de Bicarbonato
    await createFormula({
        name: 'Déficit de Bicarbonato',
        description: 'Estimativa da quantidade de bicarbonato necessária para correção de acidose.',
        category: 'Emergência',
        expression: '0.4 * weight * (target_hco3 - hco3)',
        variables: {
            create: [
                { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                { name: 'hco3', label: 'Bicarbonato Atual', unit: 'mEq/L', type: 'NUMBER' },
                { name: 'target_hco3', label: 'Bicarbonato Alvo', unit: 'mEq/L', type: 'NUMBER' }
            ]
        }
    });

    // 4. pCO2 Esperado (Winters)
    await createFormula({
        name: 'Análise de Gasometria (Winters)',
        description: 'Cálculo do pCO2 esperado em pacientes com acidose metabólica.',
        category: 'Medicina Interna',
        expression: '(1.5 * hco3) + 8',
        variables: {
            create: [
                { name: 'hco3', label: 'HCO3 (Bicarbonato)', unit: 'mEq/L', type: 'NUMBER' }
            ]
        }
    });

    // 5. Dose Pediátrica (Young)
    await createFormula({
        name: 'Dose Pediátrica (Regra de Young)',
        description: 'Estimativa de dose para crianças de 2 a 12 anos baseada na dose do adulto.',
        category: 'Pediatria',
        expression: '(age / (age + 12)) * adult_dose',
        variables: {
            create: [
                { name: 'age', label: 'Idade da Criança', unit: 'anos', type: 'NUMBER' },
                { name: 'adult_dose', label: 'Dose Adulto', unit: 'mg', type: 'NUMBER' }
            ]
        }
    });

    // 6. Osmolaridade Sérica
    await createFormula({
        name: 'Osmolaridade Sérica',
        description: 'Cálculo da concentração de partículas osmoticamente ativas no soro.',
        category: 'Emergência',
        expression: '(2 * na) + (glucose / 18) + (urea / 6)',
        variables: {
            create: [
                { name: 'na', label: 'Sódio (Na+)', unit: 'mEq/L', type: 'NUMBER' },
                { name: 'glucose', label: 'Glicemia', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'urea', label: 'Ureia', unit: 'mg/dL', type: 'NUMBER' }
            ]
        }
    });

    // 7. NEWS2
    await createFormula({
        name: 'NEWS2 (National Early Warning Score)',
        description: 'Sistema de pontuação para detecção precoce de deterioração clínica.',
        category: 'Emergência',
        expression: 'fr + sat + o2 + pa + fc + consc + temp',
        variables: {
            create: [
                { name: 'fr', label: 'Freq. Respiratória', type: 'SELECT', options: [{label: '12-20 (0)', value: 0}, {label: '9-11 (1)', value: 1}, {label: '21-24 (2)', value: 2}, {label: '<8 ou >25 (3)', value: 3}] },
                { name: 'sat', label: 'Saturação O2', type: 'SELECT', options: [{label: '>=96 (0)', value: 0}, {label: '94-95 (1)', value: 1}, {label: '92-93 (2)', value: 2}, {label: '<=91 (3)', value: 3}] },
                { name: 'o2', label: 'Suporte de O2', type: 'SELECT', options: [{label: 'Não (0)', value: 0}, {label: 'Sim (2)', value: 2}] },
                { name: 'pa', label: 'PA Sistólica', type: 'SELECT', options: [{label: '111-219 (0)', value: 0}, {label: '101-110 (1)', value: 1}, {label: '91-100 (2)', value: 2}, {label: '<=90 ou >=220 (3)', value: 3}] },
                { name: 'fc', label: 'Freq. Cardíaca', type: 'SELECT', options: [{label: '51-90 (0)', value: 0}, {label: '41-50 ou 91-110 (1)', value: 1}, {label: '111-130 (2)', value: 2}, {label: '<=40 ou >=131 (3)', value: 3}] },
                { name: 'consc', label: 'Nível Consciência', type: 'SELECT', options: [{label: 'Alerta (0)', value: 0}, {label: 'Novo Confuso/V/P/U (3)', value: 3}] },
                { name: 'temp', label: 'Temperatura', type: 'SELECT', options: [{label: '36.1-38.0 (0)', value: 0}, {label: '35.1-36.0 ou 38.1-39.0 (1)', value: 1}, {label: '>=39.1 (2)', value: 2}, {label: '<=35.0 (3)', value: 3}] }
            ]
        }
    });

    // 8. CURB-65
    await createFormula({
        name: 'CURB-65 (Pneumonia)',
        description: 'Escore de gravidade para Pneumonia Adquirida na Comunidade.',
        category: 'Pneumologia',
        expression: 'c + u + r + b + a',
        variables: {
            create: [
                { name: 'c', label: 'Confusão Mental', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'u', label: 'Ureia > 19 mg/dL', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'r', label: 'FR >= 30 ipm', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'b', label: 'PA < 90/60 mmHg', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'a', label: 'Idade >= 65 anos', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] }
            ]
        }
    });

    // 9. Wells Score
    await createFormula({
        name: 'Wells Score (TVP)',
        description: 'Estratificação de risco para Trombose Venosa Profunda.',
        category: 'Vascular',
        expression: 'ca + par + bed + tend + leg + calf + godet + vein + alt',
        variables: {
            create: [
                { name: 'ca', label: 'Câncer Ativo', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'par', label: 'Paralisia/Paresia', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'bed', label: 'Acamado > 3 dias', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'tend', label: 'Dor trajeto venoso', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'leg', label: 'Membro todo inchado', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'calf', label: 'Panturrilha > 3cm', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'godet', label: 'Edema de Cacifo', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'vein', label: 'Veias Colaterais', type: 'BOOLEAN', options: [{label: 'Sim', value: 1}, {label: 'Não', value: 0}] },
                { name: 'alt', label: 'Diagnóstico Alternativo', type: 'SELECT', options: [{label: 'Menos provável que TVP (0)', value: 0}, {label: 'Tão provável quanto TVP (-2)', value: -2}] }
            ]
        }
    });

    // 10. MELD Score
    await createFormula({
        name: 'MELD Score',
        description: 'Preditor de sobrevida em doença hepática terminal.',
        category: 'Hepatologia',
        expression: '10 * (0.957 * Math.log(Math.max(1, crea)) + 0.378 * Math.log(Math.max(1, bili)) + 1.12 * Math.log(Math.max(1, inr)) + 0.643)',
        variables: {
            create: [
                { name: 'crea', label: 'Creatinina', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'bili', label: 'Bilirrubina Total', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'inr', label: 'INR', type: 'NUMBER' }
            ]
        }
    });

    // 11. HAS-BLED
    await createFormula({
        name: 'HAS-BLED',
        description: 'Risco de sangramento maior em pacientes com Fibrilação Atrial.',
        category: 'Cardiologia',
        expression: 'h + a + s + b + l + e + d',
        variables: {
            create: [
                { name: 'h', label: 'Hipertensão (>160)', type: 'BOOLEAN' },
                { name: 'a', label: 'Função Renal/Hepática Alterada', type: 'SELECT', options: [{label: 'Não (0)', value: 0}, {label: 'Uma (1)', value: 1}, {label: 'Ambas (2)', value: 2}] },
                { name: 's', label: 'Histórico de AVC', type: 'BOOLEAN' },
                { name: 'b', label: 'Histórico de Sangramento', type: 'BOOLEAN' },
                { name: 'l', label: 'INR Lábil', type: 'BOOLEAN' },
                { name: 'e', label: 'Idoso (> 65 anos)', type: 'BOOLEAN' },
                { name: 'd', label: 'Drogas/Álcool', type: 'SELECT', options: [{label: 'Não (0)', value: 0}, {label: 'Uma (1)', value: 1}, {label: 'Ambas (2)', value: 2}] }
            ]
        }
    });

    // 12. Correção de Sódio
    await createFormula({
        name: 'Correção de Sódio (Hiperglicemia)',
        description: 'Cálculo do sódio corrigido em casos de hiperglicemia acentuada.',
        category: 'Emergência',
        expression: 'na + (1.6 * (glucose - 100) / 100)',
        variables: {
            create: [
                { name: 'na', label: 'Sódio Medido', unit: 'mEq/L', type: 'NUMBER' },
                { name: 'glucose', label: 'Glicemia', unit: 'mg/dL', type: 'NUMBER' }
            ]
        }
    });

    // 13. Cálcio Corrigido
    await createFormula({
        name: 'Cálcio Corrigido (Albumina)',
        description: 'Ajuste do cálcio sérico total em pacientes com hipoalbuminemia.',
        category: 'Medicina Interna',
        expression: 'ca + 0.8 * (4 - alb)',
        variables: {
            create: [
                { name: 'ca', label: 'Cálcio Total Medido', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'alb', label: 'Albumina Sérica', unit: 'g/dL', type: 'NUMBER' }
            ]
        }
    });

    // 14. MDRD (TFG)
    await createFormula({
        name: 'MDRD (TFG)',
        description: 'Estimativa da Taxa de Filtração Glomerular pela fórmula MDRD.',
        category: 'Nefrologia',
        expression: '175 * Math.pow(crea, -1.154) * Math.pow(age, -0.203) * gender * race',
        variables: {
            create: [
                { name: 'crea', label: 'Creatinina', unit: 'mg/dL', type: 'NUMBER' },
                { name: 'age', label: 'Idade', unit: 'anos', type: 'NUMBER' },
                { name: 'gender', label: 'Sexo', type: 'SELECT', options: [{label: 'Feminino (0.742)', value: 0.742}, {label: 'Masculino (1.0)', value: 1.0}] },
                { name: 'race', label: 'Raça', type: 'SELECT', options: [{label: 'Negra (1.212)', value: 1.212}, {label: 'Outras (1.0)', value: 1.0}] }
            ]
        }
    });

    // 15. Score CHA2DS2-VASc
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

    console.log("Calculators suite updated successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
