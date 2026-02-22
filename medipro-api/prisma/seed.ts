import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes (cuidado em produção!)
    await prisma.notification.deleteMany();
    await prisma.diagnosis.deleteMany();
    await prisma.consult.deleteMany();
    try {
        await prisma.$executeRaw`DELETE FROM audit_logs`; 
    } catch (e) {
        console.log('Tabela audit_logs pode não existir ou erro ao limpar:', e);
    }
    await prisma.subscription.deleteMany();
    await prisma.calculationHistory.deleteMany();
    await prisma.calculatorVariable.deleteMany();
    await prisma.calculatorFormula.deleteMany();
    await prisma.user.deleteMany();
    await prisma.prompt.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.endpoint.deleteMany();

    // 1. Criar Endpoint padrão
    console.log('📡 Criando endpoint padrão...');
    const endpoint = await prisma.endpoint.create({
        data: {
            name: 'OpenAI GPT-4',
            url: 'https://api.openai.com/v1/chat/completions',
            method: 'POST',
            authType: 'BEARER',
            credentials: {
                apiKey: process.env.OPENAI_API_KEY || 'sua-chave-aqui'
            },
            status: 'ATIVO'
        }
    });

    // 3. Criar usuário ADMIN
    console.log('👤 Criando usuário administrador...');
    const hashedPasswordAdmin = await bcrypt.hash('Admin@123', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Administrador',
            email: 'admin@medipro.com',
            password: hashedPasswordAdmin,
            role: 'ADMIN',
            status: 'ATIVO',
            endpointId: endpoint.id
        }
    });

    // Criar planos
    let premiumPlan = await prisma.plan.findFirst({ where: { name: 'Premium' } });
    if (!premiumPlan) {
        premiumPlan = await prisma.plan.create({
            data: {
                name: 'Premium',
                description: 'Acesso total e ilimitado',
                price: 99.90,
                interval: 'MONTHLY',
                features: JSON.stringify(['unlimited_transcription', 'all_calculators', 'protocols']),
                active: true
            }
        });
    }

    await prisma.subscription.create({
        data: {
            userId: admin.id,
            planId: premiumPlan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date('2099-12-31T23:59:59'),
            stripeSubscriptionId: 'admin_lifetime_access'
        }
    });

    // 4. Criar médicos
    console.log('👨‍⚕️ Criando médicos...');
    const hashedPasswordMedico = await bcrypt.hash('Medico@123', 10);

    const medico1 = await prisma.user.create({
        data: {
            name: 'Dr. Tiago Carlos Sulzbach',
            email: 'tiago.carlos.sulzbach@gmail.com',
            password: hashedPasswordMedico,
            phone: '(51) 98328-8328',
            address: 'Rua Paris, 112',
            role: 'MEDICO',
            status: 'ATIVO',
            endpointId: endpoint.id
        }
    });

    const medico2 = await prisma.user.create({
        data: {
            name: 'Dr. Misael Rosa Tavernard',
            email: 'misael@medipro.com',
            password: hashedPasswordMedico,
            role: 'MEDICO',
            status: 'ATIVO',
            endpointId: endpoint.id
        }
    });

    const medico3 = await prisma.user.create({
        data: {
            name: 'Dra. Natalia Rodrigues Ibanes',
            email: 'natalia@medipro.com',
            password: hashedPasswordMedico,
            role: 'MEDICO',
            status: 'ATIVO',
            endpointId: endpoint.id
        }
    });

    // 4. Criar consultas de exemplo
    console.log('📅 Criando consultas de exemplo...');
    const consult1 = await prisma.consult.create({
        data: {
            patientName: 'João Silva',
            doctorId: medico1.id,
            doctorName: medico1.name,
            date: new Date('2025-12-18T11:04:00'),
            type: 'CONSULTA',
            status: 'CONCLUIDA'
        }
    });

    const consult2 = await prisma.consult.create({
        data: {
            patientName: 'Maria Santos',
            doctorId: medico2.id,
            doctorName: medico2.name,
            date: new Date('2025-12-18T10:05:00'),
            type: 'CONSULTA',
            status: 'CONCLUIDA'
        }
    });

    // 5. Criar diagnósticos de exemplo
    console.log('🩺 Criando diagnósticos de exemplo...');
    await prisma.diagnosis.create({
        data: {
            consultId: consult1.id,
            doctorId: medico1.id,
            patientName: 'João Silva',
            userPrompt: 'Paciente relata dores no peito e extrema dor de cabeça, histórico de pressão alta',
            aiResponse: `**Modelo de Evolução Médica (SOAP)**\n\n**Subjetivo (S):**\nPaciente relata dores no peito e cefaleia intensa.\n\n**Objetivo (O):**\n- PA: 160/100 mmHg\n\n**Avaliação (A):**\nCrise hipertensiva.\n\n**Plano (P):**\nAjuste da medicação.`,
            model: 'gpt-4',
            status: 'ORIGINAL'
        }
    });

    // 6. Criar prompts padrão
    console.log('📝 Criando prompts padrão...');
    await prisma.prompt.create({
        data: {
            name: 'Médico Padrão',
            category: 'DIAGNOSTICO',
            content: `Analise os sintomas fornecidos e gere um diagnóstico diferencial completo.`,
            isActive: true
        }
    });

    // 7. Criar configurações do sistema
    console.log('⚙️ Criando configurações do sistema...');
    const settings = [
        { key: 'sistema_nome', value: 'MEDIPRO', type: 'STRING', category: 'GERAL', required: true, description: 'Nome do sistema' },
        { key: 'sistema_versao', value: '1.0.0', type: 'STRING', category: 'SISTEMA', required: true, description: 'Versão atual do sistema' },
        { key: 'site_do_sistema', value: 'https://medipro.conceittosistemas.com.br', type: 'STRING', category: 'GERAL', required: true, description: 'URL do sistema' }
    ];

    for (const setting of settings) {
        await prisma.setting.create({ data: setting as any });
    }

    // 8. Criar notificações de exemplo
    console.log('🔔 Criando notificações de exemplo...');
    await prisma.notification.create({
        data: {
            userId: medico1.id,
            type: 'SUCCESS',
            title: 'Diagnóstico Concluído',
            message: 'O diagnóstico para o paciente João Silva foi gerado com sucesso.',
            read: false,
            link: '/diagnostico'
        }
    });

    // 9. Criar Calculadoras Médicas
    console.log('🧮 Criando calculadoras médicas (Full Suite)...');

    const calculators = [
        {
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
        },
        {
            name: 'Depuração de Creatinina (Cockcroft-Gault)',
            description: 'Estimativa da taxa de filtração glomerular renal.',
            category: 'Nefrologia',
            expression: '((140 - age) * weight * gender) / (72 * creatinine)',
            variables: {
                create: [
                    { name: 'age', label: 'Idade', unit: 'anos', type: 'NUMBER' },
                    { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                    { name: 'creatinine', label: 'Creatinina Sérica', unit: 'mg/dL', type: 'NUMBER' },
                    { name: 'gender', label: 'Sexo', type: 'SELECT', options: [{ label: "Masculino", value: 1 }, { label: "Feminino", value: 0.85 }] }
                ]
            }
        },
        {
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
        },
        {
            name: 'Análise de Gasometria (Winters)',
            description: 'Cálculo do pCO2 esperado em pacientes com acidose metabólica.',
            category: 'Medicina Interna',
            expression: '(1.5 * hco3) + 8',
            variables: { create: [{ name: 'hco3', label: 'HCO3 (Bicarbonato)', unit: 'mEq/L', type: 'NUMBER' }] }
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
            name: 'Wells Score (TVP)',
            description: 'Estratificação de risco para Trombose Venosa Profunda.',
            category: 'Vascular',
            expression: 'ca + par + bed + tend + leg + calf + godet + vein + alt',
            variables: {
                create: [
                    { name: 'ca', label: 'Câncer Ativo', type: 'BOOLEAN' },
                    { name: 'par', label: 'Paralisia/Paresia', type: 'BOOLEAN' },
                    { name: 'bed', label: 'Acamado > 3 dias', type: 'BOOLEAN' },
                    { name: 'tend', label: 'Dor trajeto venoso', type: 'BOOLEAN' },
                    { name: 'leg', label: 'Membro todo inchado', type: 'BOOLEAN' },
                    { name: 'calf', label: 'Panturrilha > 3cm', type: 'BOOLEAN' },
                    { name: 'godet', label: 'Edema de Cacifo', type: 'BOOLEAN' },
                    { name: 'vein', label: 'Veias Colaterais', type: 'BOOLEAN' },
                    { name: 'alt', label: 'Diagnóstico Alternativo', type: 'SELECT', options: [{label: 'Menos provável que TVP (0)', value: 0}, {label: 'Tão provável quanto TVP (-2)', value: -2}] }
                ]
            }
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
            name: 'Score CHA₂DS₂-VASc (Risco AVC)',
            description: 'Estratificação de risco para AVC em Fibrilação Atrial.',
            category: 'Cardiologia',
            expression: 'age_score + sex_score + chf + hypertension + stroke + vascular + diabetes',
            variables: {
                create: [
                    { name: 'age_score', label: 'Idade', type: 'SELECT', options: [{ label: "< 65 anos", value: 0 }, { label: "65-74 anos", value: 1 }, { label: "≥ 75 anos", value: 2 }] },
                    { name: 'sex_score', label: 'Sexo', type: 'SELECT', options: [{ label: "Masculino", value: 0 }, { label: "Feminino", value: 1 }] },
                    { name: 'chf', label: 'Insuficiência Cardíaca', type: 'BOOLEAN' },
                    { name: 'hypertension', label: 'Hipertensão', type: 'BOOLEAN' },
                    { name: 'stroke', label: 'AVC/AIT Prévio', type: 'BOOLEAN' },
                    { name: 'vascular', label: 'Doença Vascular', type: 'BOOLEAN' },
                    { name: 'diabetes', label: 'Diabetes', type: 'BOOLEAN' }
                ]
            }
        }
    ];

    for (const calc of calculators) {
        await prisma.calculatorFormula.create({ data: calc as any });
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📧 Credenciais criadas:');
    console.log('----------------------------------');
    console.log('ADMIN:');
    console.log('  Email: admin@medipro.com');
    console.log('  Senha: Admin@123');
    console.log('\nMÉDICOS:');
    console.log('  Email: tiago.carlos.sulzbach@gmail.com');
    console.log('  Senha: Medico@123');
    console.log('----------------------------------\n');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
