import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes (cuidado em produção!)
    await prisma.notification.deleteMany();
    await prisma.diagnosis.deleteMany();
    await prisma.consult.deleteMany();
    // Limpar logs de auditoria antes dos usuários (FK constraint)
    try {
        await prisma.$executeRaw`DELETE FROM audit_logs`; 
    } catch (e) {
        console.log('Tabela audit_logs pode não existir ou erro ao limpar:', e);
    }
    // Limpar subscriptions antes de usuários (FK constraint)
    await prisma.subscription.deleteMany();
    // Limpar histórico de calculadoras
    await prisma.calculationHistory.deleteMany();
    // Limpar variáveis de calculadoras antes das fórmulas
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

    // 3. Criar usuário ADMIN com Plano Premium Vitalício
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

    // Criar planos se não existirem (garantia)
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

    // Dar assinatura Premium para o Admin
    console.log('🌟 Atribuindo plano Premium vitalício para Admin...');
    await prisma.subscription.create({
        data: {
            userId: admin.id,
            planId: premiumPlan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date('2099-12-31T23:59:59'), // Vitalício de facto
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

    await prisma.consult.create({
        data: {
            patientName: 'Pedro Almeida',
            doctorId: medico1.id,
            doctorName: medico1.name,
            date: new Date('2025-12-21T09:00:00'),
            type: 'CONSULTA',
            status: 'AGENDADA'
        }
    });

    await prisma.consult.create({
        data: {
            patientName: 'Ana Oliveira',
            doctorId: medico1.id,
            doctorName: medico1.name,
            date: new Date('2025-12-21T10:30:00'),
            type: 'RETORNO',
            status: 'AGENDADA'
        }
    });

    await prisma.consult.create({
        data: {
            patientName: 'Carlos Souza',
            doctorId: medico3.id,
            doctorName: medico3.name,
            date: new Date('2025-12-19T14:15:00'),
            type: 'EMERGENCIA',
            status: 'CONCLUIDA'
        }
    });

    await prisma.consult.create({
        data: {
            patientName: 'Lucia Ferreira',
            doctorId: medico1.id,
            doctorName: medico1.name,
            date: new Date('2025-12-22T11:00:00'),
            type: 'CONSULTA',
            status: 'AGENDADA'
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
            aiResponse: `**Modelo de Evolução Médica (SOAP)**

**Identificação do paciente**
- Nome: João Silva
- Sexo: Masculino

**Subjetivo (S):**
Paciente relata dores no peito e cefaleia intensa. Refere histórico de hipertensão arterial.

**Objetivo (O):**
- Pressão arterial: 160/100 mmHg
- Frequência cardíaca: 92 bpm
- Temperatura: 36.8°C

**Avaliação (A):**
Diagnóstico diferencial:
1. Cefaleia tensional secundária à HAS não controlada
2. Possível angina estável
3. Crise hipertensiva

**Plano (P):**
1. Ajuste da medicação anti-hipertensiva
2. Solicitação de ECG
3. Avaliação cardiológica
4. Orientações sobre hábitos de vida`,
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
            content: `### Contexto
Você está em um hospital de clínicas, você interage diretamente com médicos legais e registrados que entendem os termos médicos.

### Instruções
Analise os sintomas fornecidos e gere um diagnóstico diferencial completo.
Use terminologia médica apropriada.
Seja preciso e baseado em evidências.`,
            isActive: true
        }
    });

    await prisma.prompt.create({
        data: {
            name: 'SOAP',
            category: 'TRATAMENTO',
            content: `# Prompt para Geração de Evolução Médica no Formato SOAP

## Instrução Principal
Você é um médico experiente responsável por redigir evoluções médicas no formato SOAP.

## Formato de Resposta
Use sempre a estrutura:
- **Subjetivo (S):** Queixas do paciente
- **Objetivo (O):** Dados vitais e exame físico
- **Avaliação (A):** Diagnóstico diferencial
- **Plano (P):** Condutas e orientações`,
            isActive: true
        }
    });

    // 7. Criar configurações do sistema
    console.log('⚙️ Criando configurações do sistema...');
    const settings = [
        { key: 'sistema_nome', value: 'MEDIPRO', type: 'STRING', category: 'GERAL', required: true, description: 'Nome do sistema' },
        { key: 'sistema_versao', value: '1.0.0', type: 'STRING', category: 'SISTEMA', required: true, description: 'Versão atual do sistema' },
        { key: 'site_do_sistema', value: 'https://medipro.conceittosistemas.com.br', type: 'STRING', category: 'GERAL', required: true, description: 'URL do sistema' },
        { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN', category: 'SISTEMA', required: false, description: 'Modo de manutenção' },
        { key: 'notifications_enabled', value: 'true', type: 'BOOLEAN', category: 'NOTIFICACOES', required: false, description: 'Notificações ativas' },
    ];

    for (const setting of settings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    await prisma.notification.create({
        data: {
            userId: medico1.id,
            type: 'INFO',
            title: 'Nova Consulta Agendada',
            message: 'Consulta com Maria Santos agendada para 20/12/2025 às 14:00.',
            read: false
        }
    });

    // 9. Criar Calculadoras Médicas
    console.log('🧮 Criando calculadoras médicas...');

    // IMC
    await prisma.calculatorFormula.create({
        data: {
            name: 'Índice de Massa Corporal (IMC)',
            description: 'Avaliação do estado nutricional baseado em peso e altura.',
            category: 'Geral',
            expression: 'weight / (height * height)',
            reference: 'OMS',
            variables: {
                create: [
                    { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER', min: 0, max: 500, step: 0.1 },
                    { name: 'height', label: 'Altura', unit: 'm', type: 'NUMBER', min: 0, max: 3, step: 0.01 }
                ]
            }
        }
    });

    // Cockcroft-Gault (Clearance de Creatinina)
    await prisma.calculatorFormula.create({
        data: {
            name: 'Depuração de Creatinina (Cockcroft-Gault)',
            description: 'Estimativa da taxa de filtração glomerular renal baseada na creatinina sérica.',
            category: 'Nefrologia',
            expression: '((140 - age) * weight * gender) / (72 * creatinine)',
            reference: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.',
            variables: {
                create: [
                    { name: 'age', label: 'Idade', type: 'NUMBER', unit: 'anos', min: 18, max: 120 },
                    { name: 'weight', label: 'Peso', type: 'NUMBER', unit: 'kg', min: 30, max: 300 },
                    { name: 'creatinine', label: 'Creatinina Sérica', type: 'NUMBER', unit: 'mg/dL', min: 0.1, max: 20, step: 0.1 },
                    {
                        name: 'gender',
                        label: 'Sexo',
                        type: 'SELECT',
                        unit: '',
                        options: [
                            { label: 'Masculino', value: 1 },
                            { label: 'Feminino', value: 0.85 }
                        ]
                    }
                ]
            }
        }
    });

    // Score CHA2DS2-VASc
    await prisma.calculatorFormula.create({
        data: {
            name: 'Score CHA₂DS₂-VASc (Risco AVC)',
            description: 'Estratificação de risco para AVC em Fibrilação Atrial.',
            category: 'Cardiologia',
            expression: 'age_score + sex_score + chf + hypertension + stroke + vascular + diabetes',
            reference: 'Lip GY, et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation. Chest. 2010.',
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
        }
    });

    // LDL Friedewald
    await prisma.calculatorFormula.create({
        data: {
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
        }
    });

    // Glasgow Coma Scale
    await prisma.calculatorFormula.create({
        data: {
            name: 'Escala de Coma de Glasgow',
            description: 'Avaliação do nível de consciência após trauma.',
            category: 'Emergência',
            expression: 'eye + verbal + motor',
            reference: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness. A practical scale. Lancet. 1974.',
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
        }
    });

    // QT Corrected (Bazett)
    await prisma.calculatorFormula.create({
        data: {
            name: 'QT Corrigido (Bazett)',
            description: 'Correção do intervalo QT pela frequência cardíaca.',
            category: 'Cardiologia',
            expression: 'qt / sqrt(rr)',
            variables: {
                create: [
                    { name: 'qt', label: 'Intervalo QT (s)', unit: 'segundos', type: 'NUMBER', min: 0, max: 2 },
                    { name: 'rr', label: 'Intervalo RR (s)', unit: 'segundos', type: 'NUMBER', min: 0, max: 2 }
                ]
            }
        }
    });

    // Anion Gap
    await prisma.calculatorFormula.create({
        data: {
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
        }
    });

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
