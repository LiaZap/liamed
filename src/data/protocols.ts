export interface Protocol {
  id: string;
  title: string;
  category: string;
  description: string;
  lastUpdate: string;
  steps: string[];
  source: string;
}

export const PROTOCOLS: Protocol[] = [
  // EMERGÊNCIA
  {
    id: "acls-2025",
    title: "ACLS - Suporte Avançado de Vida Cardiovascular",
    category: "Emergência",
    description: "Algoritmo de Parada Cardiorrespiratória (PCR) e Cuidados Pós-PCR.",
    lastUpdate: "2025",
    steps: [
      "Iiniciar RCP de alta qualidade (comprimir forte e rápido).",
      "Monitor/Desfibrilador: Checar ritmo. Ritmo chocável (FV/TV)?",
      "SIM: Choque → RCP 2 min → Acesso IV/IO.",
      "NÃO (Assistolia/AESP): RCP 2 min → Acesso IV/IO → Epinefrina a cada 3-5 min → Considerar Via Aérea Avançada.",
      "Cuidados Pós-RSC: Otimizar ventilação/oxigenação e hemodinâmica."
    ],
    source: "AHA Guidelines"
  },
  {
    id: "atls-10",
    title: "ATLS - Suporte Avançado de Vida no Trauma",
    category: "Emergência",
    description: "Avaliação primária e secundária no trauma (ABCDE).",
    lastUpdate: "10ª Ed.",
    steps: [
      "A (Airway): Via aérea com controle da coluna cervical.",
      "B (Breathing): Respiração e ventilação.",
      "C (Circulation): Circulação com controle de hemorragia.",
      "D (Disability): Incapacidade neurológica (Glasgow, pupilas).",
      "E (Exposure): Exposição e controle do ambiente (prevenir hipotermia)."
    ],
    source: "American College of Surgeons"
  },
  {
    id: "sepsis-3",
    title: "Sepse - Surviving Sepsis Campaign",
    category: "Emergência",
    description: "Protocolo de reconhecimento e tratamento da sepse e choque séptico (Hour-1 Bundle).",
    lastUpdate: "2021",
    steps: [
      "Medir lactato sérico. Repetir se inicial > 2 mmol/L.",
      "Obter hemoculturas antes de administrar antibióticos.",
      "Administrar antibióticos de amplo espectro.",
      "Administrar 30 mL/kg de cristalóide para hipotensão ou lactato ≥ 4 mmol/L.",
      "Iniciar vasopressores se hipotenso durante ou após ressuscitação volêmica (PAM ≥ 65 mmHg)."
    ],
    source: "Surviving Sepsis Campaign"
  },

  // CARDIOLOGIA
  {
    id: "iam-cst",
    title: "IAM com Supradesnivelamento de ST",
    category: "Cardiologia",
    description: "Manejo agudo do Infarto Agudo do Miocárdio com supra de ST.",
    lastUpdate: "2024",
    steps: [
      "ECG em até 10 minutos.",
      "AAS 160-325mg mastigado (se não alérgico).",
      "Clopidogrel 300-600mg (dose de ataque).",
      "Heparina não fracionada ou HBPM.",
      "Avaliar reperfusão: ICP Primária (Ideal < 90 min) ou Fibrinólise (se ICP > 120 min)."
    ],
    source: "SBC / AHA"
  },
  {
    id: "ic-aguda",
    title: "Insuficiência Cardíaca Descompensada",
    category: "Cardiologia",
    description: "Manejo da IC aguda na sala de emergência.",
    lastUpdate: "2023",
    steps: [
      "Avaliar perfusão (Quente/Frio) e congestão (Úmido/Seco).",
      "Perfil B (Quente e Úmido - mais comum): Diuréticos de alça (Furosemida) + Vasodilatadores (Nitroglicerina/Nitroprussiato) se PA permitir.",
      "Perfil C (Frio e Úmido): Inotrópicos (Dobutamina) + Diuréticos.",
      "Perfil L (Frio e Seco): Hidratação com cautela."
    ],
    source: "SBC Diretriz"
  },
  {
    id: "fa-aguda",
    title: "Fibrilação Atrial Aguda",
    category: "Cardiologia",
    description: "Controle de ritmo vs frequência em FA aguda.",
    lastUpdate: "2023",
    steps: [
      "Instável hemodinamicamente? Cardioversão Elétrica Sincronizada.",
      "Estável > 48h ou desconhecido? Anticoagular 3 semanas antes ou ECO Transesofágico para descartar trombo.",
      "Estável < 48h? Considerar cardioversão química (Amiodarona/Propafenona).",
      "Controle de Frequência: Betabloqueadores, Verapamil/Diltiazem ou Digitais."
    ],
    source: "SBC / ESC"
  },

  // PEDIATRIA
  {
    id: "pals-ar",
    title: "PALS - Insuficiência Respiratória",
    category: "Pediatria",
    description: "Manejo da dificuldade respiratória na criança.",
    lastUpdate: "2025",
    steps: [
      "Avaliar vias aéreas: manter permeável.",
      "Oxigenoterapia para manter SpO2 > 94%.",
      "Obstrução Alta (Crupe/Epiglotite): Nebulização com Adrenalina, Corticóide.",
      "Obstrução Baixa (Asma/Bronquiolite): Broncodilatadores, Corticóides.",
      "Doença do Tecido Pulmonar (Pneumonia): Antibióticos, Suporte ventilatório."
    ],
    source: "AHA PALS"
  },
  {
    id: "desidratacao-ped",
    title: "Desidratação em Pediatria",
    category: "Pediatria",
    description: "Planos de reidratação A, B e C.",
    lastUpdate: "2023",
    steps: [
      "Plano A (Sem desidratação): SRO após perdas, manter dieta.",
      "Plano B (Desidratação leve/moderada): TRO na unidade, 50-100ml/kg em 4-6h.",
      "Plano C (Desidratação grave/choque): Expansão rápida IV com SF0,9% ou Ringer 20ml/kg. Repetir se necessário."
    ],
    source: "Ministério da Saúde"
  },

  // CLÍNICA MÉDICA
  {
    id: "cetoacidose",
    title: "Cetoacidose Diabética (CAD)",
    category: "Endocrinologia",
    description: "Protocolo de correção hidroeletrolítica e insulínica.",
    lastUpdate: "2024",
    steps: [
      "Hidratação vigorosa: SF 0,9% 15-20ml/kg na 1ª hora.",
      "Potássio: Se K < 3.3, repor antes da insulina. Se 3.3-5.2, repor junto.",
      "Insulina: Regular IV 0.1 U/kg ataque + 0.1 U/kg/h manutenção.",
      "Glicemia alvo de queda: 50-70 mg/dL/h.",
      "Quando glicemia < 200: adicionar SG 5% na hidratação e reduzir insulina."
    ],
    source: "ADA Standards"
  },
  {
    id: "avc-isquemico",
    title: "AVC Isquêmico Agudo",
    category: "Neurologia",
    description: "Avaliação para trombólise.",
    lastUpdate: "2023",
    steps: [
      "TC de Crânio sem contraste imediata (descartar hemorragia).",
      "Tempo < 4.5h e sem contraindicações? Trombólise com Alteplase.",
      "Oclusão de grande vaso e tempo < 6h (ou até 24h selecionados)? Trombectomia Mecânica.",
      "Controle pressórico: PA < 185/110 para trombolisar. Permissiva até 220/120 se não trombolisar."
    ],
    source: "AHA / ASA Guidelines"
  }
];

export const CATEGORIES = [
  "Todos",
  "Emergência",
  "Cardiologia",
  "Pediatria",
  "Neurologia",
  "Endocrinologia",
  "Ginecologia",
  "Ortopedia"
];
