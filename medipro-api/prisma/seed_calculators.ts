import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Calculators...');

    // 1. BMI
    // @ts-ignore
    const bmi = await prisma.calculatorFormula.create({
        data: {
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
        }
    });
    console.log({ bmi });

    // 2. Creatinine Clearance (Cockcroft-Gault)
    // Formula: ((140 - age) * weight) / (72 * creatinine) * (0.85 if female)
    // We handle sex factor in the frontend or simple backend logic?
    // Math.js expression support conditionals? 'sex' will be 1 or 0.85 passed from frontend options
    // @ts-ignore
    const crcl = await prisma.calculatorFormula.create({
        data: {
            name: 'Depuração de Creatinina (Cockcroft-Gault)',
            description: 'Estimativa da taxa de filtração glomerular renal.',
            category: 'Nefrologia',
            expression: '((140 - age) * weight) / (72 * creatinine) * sex',
            variables: {
                create: [
                    { name: 'age', label: 'Idade', unit: 'anos', type: 'NUMBER' },
                    { name: 'weight', label: 'Peso', unit: 'kg', type: 'NUMBER' },
                    { name: 'creatinine', label: 'Creatinina Sérica', unit: 'mg/dL', type: 'NUMBER' },
                    {
                        name: 'sex',
                        label: 'Sexo',
                        type: 'SELECT', // VariableType enum
                        options: [ // JSON
                            { label: "Masculino", value: 1 },
                            { label: "Feminino", value: 0.85 }
                        ]
                    }
                ]
            }
        }
    });

    console.log({ crcl });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
