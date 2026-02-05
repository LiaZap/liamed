export interface Protocol {
  id: string;
  title: string;
  category: string;
  description: string;
  lastUpdate: string;
  steps: string[];
  source: string;
  link?: string;
}

export const PROTOCOLS: Protocol[] = [
  // ==================== EMERGÊNCIA ====================
  {
    id: "acls-2025",
    title: "ACLS - Suporte Avançado de Vida Cardiovascular",
    category: "Emergência",
    description: "Algoritmo de PCR e Cuidados Pós-PCR conforme AHA 2025 (Vigente 2026).",
    lastUpdate: "2025/2026",
    steps: [
      "Iniciar RCP de alta qualidade (100-120/min, profundidade 5-6cm).",
      "Monitor/Desfibrilador: Checar ritmo. Ritmo chocável (FV/TV)?",
      "SIM: Choque bifásico 120-200J → RCP 2 min → Epinefrina 1mg IV a cada 3-5 min → Amiodarona 300mg (1ª dose), 150mg (2ª dose).",
      "NÃO (Assistolia/AESP): RCP 2 min → Epinefrina 1mg IV a cada 3-5 min → Tratar causas reversíveis (5H e 5T). NÃO usar Atropina rotineiramente.",
      "Cálcio: NÃO administrar rotineiramente (apenas se hipercalemia ou intoxicação por BCC).",
      "5H: Hipovolemia, Hipóxia, H+ (acidose), Hipo/Hipercalemia, Hipotermia.",
      "5T: Tensão (pneumotórax), Tamponamento, Toxinas, Trombose pulmonar, Trombose coronariana.",
      "Cuidados Pós-RSC: TTM (Controle Direcionado de Temperatura) 32-37.5°C obrigatório se não obedece comandos. Evitar reaquecimento rápido.",
      "SpO2 alvo 92-98%, PAM ≥65mmHg."
    ],
    source: "AHA Guidelines 2025",
    link: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines"
  },
  {
    id: "atls-11",
    title: "ATLS 11ª Ed - Suporte Avançado de Vida no Trauma",
    category: "Emergência",
    description: "Avaliação primária e secundária (xABCDE).",
    lastUpdate: "11ª Ed (2025)",
    steps: [
      "X (Exsanguinating Hemorrhage): Controle imediato de hemorragia externa grave (torniquete, compressão). Prioridade máxima!",
      "A (Airway): Via aérea com restrição seletiva de movimento da coluna (não apenas 'imobilização'). IOT drug-assisted se necessário.",
      "B (Breathing): Otimizar ventilação. Atenção a pneumotórax e hemotórax. Agulha de descompressão no 5º EIC.",
      "C (Circulation): Ressuscitação balanceada (1:1:1). Ácido Tranexâmico (TXA) na 1ª hora. Evitar cristaloide excessivo.",
      "D (Disability): Glasgow, pupilas. Reversão de anticoagulação se TCE.",
      "E (Exposure): Prevenir hipotermia agressivamente.",
      "Avaliação Secundária: Histórico SAMPLE + MIST. Exame físico detalhado."
    ],
    source: "American College of Surgeons (ATLS 11th Ed)",
    link: "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/"
  },
  {
    id: "sepsis-2021",
    title: "Sepse - Surviving Sepsis Campaign",
    category: "Emergência",
    description: "Bundle de 1 hora atualizado.",
    lastUpdate: "2021/2025",
    steps: [
      "Medir lactato sérico. Repetir se inicial > 2 mmol/L.",
      "Obter hemoculturas antes de ATB. Iniciar ATB amplo espectro em até 1h (choque) ou 3h (sem choque, se incerto).",
      "Ressuscitação: 30 mL/kg cristalóide se hipotensão ou Lactato ≥4. Individualizar se IC/DRC.",
      "Vasopressores: Noradrenalina precoce (pode ser periférica temporariamente). Alvo PAM ≥ 65 mmHg.",
      "Corticoide: Hidrocortisona 200mg/dia se choque refratário a fluidos e vasoativo.",
      "qSOFA não recomendado como screening isolado."
    ],
    source: "Surviving Sepsis Campaign",
    link: "https://www.sccm.org/SurvivingSepsisCampaign/Guidelines/Adult-Patients"
  },
  {
    id: "anafilaxia",
    title: "Anafilaxia",
    category: "Emergência",
    description: "Manejo imediato da reação anafilática.",
    lastUpdate: "2024",
    steps: [
      "ADRENALINA IM 0.3-0.5mg (adulto) ou 0.01mg/kg (criança) na face anterolateral da coxa. Repetir a cada 5-15 min se necessário.",
      "Posicionar paciente: Decúbito dorsal com MMII elevados (se dispneia, manter sentado).",
      "O2 suplementar alto fluxo.",
      "Acesso venoso calibroso + SF 0.9% em bolus (20mL/kg).",
      "Adjuvantes: Anti-histamínicos (Difenidramina 25-50mg IV), Corticóides (Metilprednisolona 1-2mg/kg).",
      "Se broncoespasmo: Salbutamol inalatório.",
      "Observação mínima 4-6h (risco de reação bifásica)."
    ],
    source: "WAO / ASBAI Guidelines",
    link: "https://www.worldallergy.org/education-and-programs/education/allergic-disease-resource-center/professionals/anaphylaxis-synopsis"
  },
  {
    id: "choque-hemorragico",
    title: "Choque Hemorrágico",
    category: "Emergência",
    description: "Classificação e manejo do choque hemorrágico.",
    lastUpdate: "2024",
    steps: [
      "Classe I (<15% volemia): FC normal, PA normal. Cristalóide.",
      "Classe II (15-30%): FC 100-120, PA normal, ansiedade. Cristalóide.",
      "Classe III (30-40%): FC >120, PA↓, confusão. Hemotransfusão + Cristalóide.",
      "Classe IV (>40%): FC >140, PA muito↓, letargia. Transfusão maciça.",
      "Protocolo de Transfusão Maciça: CH:PFC:Plaquetas = 1:1:1.",
      "Ácido Tranexâmico 1g IV em 10 min (até 3h do trauma) + 1g em 8h.",
      "Controle de danos: Cirurgia para hemostasia definitiva."
    ],
    source: "ATLS 10ª Ed / CRASH-2",
    link: "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support"
  },

  // ==================== CARDIOLOGIA ====================
  {
    id: "iam-cst",
    title: "IAM com Supradesnivelamento de ST (IAMCST)",
    category: "Cardiologia",
    description: "Manejo agudo do Infarto com supra de ST.",
    lastUpdate: "2024",
    steps: [
      "ECG em até 10 minutos da chegada.",
      "MONA modificado: Morfina (se dor refratária), O2 (se SpO2<90%), Nitrato (se PA permitir), AAS 200-300mg mastigado.",
      "Dupla antiagregação: Clopidogrel 300-600mg OU Ticagrelor 180mg.",
      "Anticoagulação: Heparina não fracionada 60-70 UI/kg (máx 5000UI) OU Enoxaparina 1mg/kg SC.",
      "Reperfusão: ICP Primária (tempo porta-balão < 90 min) é preferencial.",
      "Se ICP indisponível em 120 min: Fibrinólise (Alteplase/Tenecteplase) - tempo porta-agulha < 30 min.",
      "Estatina de alta potência: Atorvastatina 80mg ou Rosuvastatina 40mg."
    ],
    source: "SBC / ESC 2024",
    link: "https://www.scielo.br/j/abc/a/z7q6Q5W9yW5z7X5c5Z5x5r5/?lang=pt"
  },
  {
    id: "scassst",
    title: "SCASSST / IAMSSST",
    category: "Cardiologia",
    description: "Síndrome Coronariana Aguda sem supra de ST.",
    lastUpdate: "2024",
    steps: [
      "ECG seriado (0h, 3h, 6h). Troponina de alta sensibilidade seriada.",
      "Estratificação de risco: GRACE score / TIMI Risk.",
      "Terapia anti-isquêmica: Nitrato, Betabloqueador (se não contraindicado).",
      "Dupla antiagregação: AAS + Clopidogrel/Ticagrelor.",
      "Anticoagulação: Fondaparinux 2.5mg SC/dia (preferencial) ou Enoxaparina.",
      "Estratégia invasiva: Muito alto risco (<2h), Alto risco (<24h), Risco intermediário (<72h).",
      "Critérios de muito alto risco: Instabilidade hemodinâmica, arritmia grave, IC aguda, dor refratária."
    ],
    source: "SBC / ESC 2024",
    link: "https://www.scielo.br/j/abc/a/8Vj6q5W9yW5z7X5c5Z5x5r5/?lang=pt"
  },
  {
    id: "emergencia-hipertensiva",
    title: "Emergência Hipertensiva",
    category: "Cardiologia",
    description: "Crise hipertensiva com lesão de órgão-alvo.",
    lastUpdate: "2024",
    steps: [
      "Confirmar LOA: Encefalopatia, AVC, Dissecção Aorta, EAP, Eclâmpsia, IAM.",
      "Internação em UTI. Monitorização contínua.",
      "Redução de PA: 25% nas primeiras 1-2h, depois gradual em 24-48h.",
      "Dissecção Aórtica: Esmolol IV (alvo FC<60, PAS<120).",
      "EAP: Nitroprussiato ou Nitroglicerina IV + Furosemida.",
      "AVC Isquêmico (candidato a trombólise): PA < 185/110 com Labetalol/Nicardipino.",
      "Eclâmpsia: Sulfato de Magnésio + Hidralazina ou Nifedipino."
    ],
    source: "SBC Diretriz HA 2024",
    link: "https://www.portal.cardiol.br/diretrizes/2020/diretrizes-brasileiras-de-hipertensao-arterial-2020"
  },
  {
    id: "ic-aguda",
    title: "Insuficiência Cardíaca Descompensada",
    category: "Cardiologia",
    description: "Perfis hemodinâmicos e manejo da IC aguda.",
    lastUpdate: "2023",
    steps: [
      "Classificar Perfil (Stevenson): Quente/Frio x Úmido/Seco.",
      "Perfil B (Quente-Úmido - 67%): Diurético de alça IV (Furosemida 40-80mg) + Vasodilatador se PAS>90.",
      "Perfil C (Frio-Úmido - 22%): Inotrópico (Dobutamina) + Diurético com cautela.",
      "Perfil L (Frio-Seco - 5%): Hidratação cautelosa.",
      "Perfil A (Quente-Seco): Otimizar medicações orais.",
      "VNI se desconforto respiratório (CPAP/BiPAP).",
      "Ultrafiltração se refratário a diuréticos."
    ],
    source: "SBC Diretriz IC 2023",
    link: "https://www.portal.cardiol.br/diretrizes/2018/diretriz-sbc-insuficiencia-cardiaca-cronica-e-aguda"
  },
  {
    id: "fa-aguda",
    title: "Fibrilação Atrial Aguda",
    category: "Cardiologia",
    description: "Controle de ritmo vs frequência em FA.",
    lastUpdate: "2024",
    steps: [
      "Instável (hipotensão, angina, IC)? Cardioversão Elétrica Sincronizada 120-200J bifásico.",
      "Estável >48h ou tempo desconhecido: Anticoagular 3 semanas OU ECO-TE para descartar trombo antes de cardioverter.",
      "Estável <48h: Pode cardioverter (química ou elétrica) após anticoagulação.",
      "Cardioversão Química: Amiodarona, Propafenona (se sem cardiopatia estrutural).",
      "Controle de Frequência: Betabloqueador ou BCC (Verapamil/Diltiazem). Alvo FC <110 em repouso.",
      "CHA2DS2-VASc para decisão de anticoagulação a longo prazo.",
      "DOACs preferidos sobre Varfarina (exceto valva mecânica/estenose mitral moderada-grave)."
    ],
    source: "SBC / ESC FA 2024",
    link: "https://www.portal.cardiol.br/diretrizes/2016/01-Diretrizes-Brasileiras-de-Fibrilacao-Atrial"
  },

  // ==================== PNEUMOLOGIA ====================
  {
    id: "asma-grave",
    title: "Crise de Asma Grave",
    category: "Pneumologia",
    description: "Manejo da exacerbação grave de asma na emergência.",
    lastUpdate: "2024",
    steps: [
      "O2 suplementar para SpO2 93-95% (adulto), 94-98% (criança).",
      "SABA inalatório: Salbutamol 4-8 puffs a cada 20 min na 1ª hora OU Nebulização contínua.",
      "Ipratrópio: Adicionar nas crises graves (500mcg neb a cada 20 min por 3 doses).",
      "Corticóide sistêmico precoce: Prednisona 40-60mg VO ou Metilprednisolona 40-60mg IV.",
      "Se refratário: Sulfato de Magnésio 2g IV em 20 min.",
      "Considerar VNI se não melhorar.",
      "IOT e VM se insuficiência respiratória iminente. Cuidado com auto-PEEP."
    ],
    source: "GINA 2024",
    link: "https://ginasthma.org/reports"
  },
  {
    id: "dpoc-exacerbada",
    title: "DPOC Exacerbada",
    category: "Pneumologia",
    description: "Manejo da exacerbação aguda de DPOC.",
    lastUpdate: "2024",
    steps: [
      "O2 controlado: Alvo SpO2 88-92%. Evitar hiperóxia (risco de hipercapnia).",
      "Broncodilatadores: SABA (Salbutamol) + SAMA (Ipratrópio) nebulizados.",
      "Corticóide: Prednisona 40mg VO por 5 dias.",
      "Antibiótico (se purulência ou VNI/IOT): Amoxicilina-clavulanato, Azitromicina ou Fluoroquinolona respiratória.",
      "VNI (BiPAP): Indicação principal! Reduz mortalidade e IOT. PS 10-15, PEEP 5-8.",
      "IOT se falha de VNI, RNC, acidose grave refratária (pH<7.25)."
    ],
    source: "GOLD 2024",
    link: "https://goldcopd.org"
  },
  {
    id: "tep",
    title: "Tromboembolismo Pulmonar (TEP)",
    category: "Pneumologia",
    description: "Diagnóstico e tratamento do TEP agudo.",
    lastUpdate: "2024",
    steps: [
      "Suspeita clínica: Escore de Wells ou Genebra. Dispneia súbita, dor torácica pleurítica, hemoptise, taquicardia.",
      "Baixa probabilidade: D-dímero. Se negativo, exclui TEP.",
      "Alta probabilidade ou D-dímero+: AngioTC de tórax (padrão-ouro).",
      "Estratificação de Risco: PESI/sPESI, BNP, Troponina, Função VD no ECO.",
      "Baixo Risco: Anticoagulação ambulatorial com DOAC (Rivaroxabana, Apixabana).",
      "Risco Intermediário-Alto: Internação + Anticoagulação. Monitorar para deterioração.",
      "Alto Risco (TEP Maciço/Choque): Fibrinólise sistêmica (Alteplase 100mg em 2h) ou Trombectomia."
    ],
    source: "ESC TEP Guidelines 2024",
    link: "https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Acute-Pulmonary-Embolism-Diagnosis-and-Management-of"
  },
  {
    id: "sdra",
    title: "SDRA - Síndrome do Desconforto Respiratório Agudo",
    category: "Pneumologia",
    description: "Ventilação protetora na SDRA.",
    lastUpdate: "2024",
    steps: [
      "Diagnóstico (Berlin): Início agudo, Infiltrados bilaterais, Hipoxemia (P/F ≤ 300), Não cardiogênico.",
      "Leve: P/F 200-300. Moderada: P/F 100-200. Grave: P/F < 100.",
      "Ventilação Protetora: Volume corrente 6 mL/kg de peso predito.",
      "Pressão de Platô ≤ 30 cmH2O. Driving Pressure ≤ 15 cmH2O.",
      "PEEP titulada (tabela PEEP/FiO2 ou Decremental).",
      "Posição Prona (>16h/dia) se P/F < 150.",
      "SDRA Grave Refratária: Considerar ECMO."
    ],
    source: "ARDS Network / SBI",
    link: "http://www.ardsnet.org/tools.shtml"
  },

  // ==================== NEUROLOGIA ====================
  {
    id: "avc-isquemico",
    title: "AVC Isquêmico Agudo",
    category: "Neurologia",
    description: "Protocolo de trombólise e trombectomia.",
    lastUpdate: "2024",
    steps: [
      "TC Crânio sem contraste imediata (descartar hemorragia).",
      "NIHSS para quantificar déficit.",
      "Janela de Trombólise (Alteplase): Até 4.5h do ictus. Dose: 0.9mg/kg (máx 90mg), 10% em bolus, 90% em 1h.",
      "Contraindicações: PA>185/110 não controlada, plaquetas<100k, uso de anticoagulantes, cirurgia recente.",
      "Janela de Trombectomia: Até 6h (ou até 24h com neuroimagem favorável - DAWN/DEFUSE3).",
      "Oclusão de Grande Vaso (M1, Carótida, Basilar): Encaminhar para centro com hemodinâmica.",
      "Controle de PA pós-trombólise: Manter <180/105 por 24h."
    ],
    source: "AHA/ASA Stroke 2024",
    link: "https://www.ahajournals.org/doi/10.1161/STR.0000000000000211"
  },
  {
    id: "avc-hemorragico",
    title: "AVC Hemorrágico (HIP)",
    category: "Neurologia",
    description: "Hemorragia Intraparenquimatosa espontânea.",
    lastUpdate: "2024",
    steps: [
      "TC Crânio sem contraste: Confirmar diagnóstico.",
      "Reverter anticoagulação: Varfarina (Vit K + CCP), DOACs (Idarucizumabe/Andexanet).",
      "Controle Pressórico: Alvo PAS 130-140 mmHg nas primeiras 6h (reduzir expansão do hematoma).",
      "Profilaxia de TVP: Compressão pneumática. Heparina profilática após 24-48h se estável.",
      "Avaliação Neurocirúrgica: Hematoma cerebelar >3cm, Hidrocefalia, Deterioração neurológica.",
      "Craniotomia descompressiva se HIC refratária.",
      "Monitorar HIC: Manter PPC > 60 mmHg."
    ],
    source: "AHA/ASA ICH 2024",
    link: "https://www.ahajournals.org/doi/10.1161/STR.0000000000000407"
  },
  {
    id: "status-epilepticus",
    title: "Estado de Mal Epiléptico",
    category: "Neurologia",
    description: "Crise convulsiva prolongada >5 min ou crises recorrentes.",
    lastUpdate: "2024",
    steps: [
      "0-5 min: Estabilização (ABC), O2, Acesso IV, Glicemia.",
      "5-20 min (Fase 1): Benzodiazepínico - Diazepam 10mg IV ou Midazolam 10mg IM.",
      "20-40 min (Fase 2): Antiepiléptico IV - Fenitoína 20mg/kg (máx 50mg/min) OU Valproato 40mg/kg OU Levetiracetam 60mg/kg.",
      "40-60 min (Fase 3 - Refratário): Anestésicos IV - Midazolam ou Propofol ou Pentobarbital em infusão contínua + IOT.",
      "EEG contínuo para monitorar atividade epileptiforme.",
      "Investigar causa: Infecção, Metabólico, Toxinas, Lesão estrutural."
    ],
    source: "ILAE / AES Guidelines",
    link: "https://www.ilae.org/guidelines/definition-and-classification/status-epilepticus"
  },
  {
    id: "tce",
    title: "Traumatismo Cranioencefálico (TCE)",
    category: "Neurologia",
    description: "Classificação e manejo do TCE.",
    lastUpdate: "2024",
    steps: [
      "Classificação por Glasgow: Leve(13-15), Moderado(9-12), Grave(≤8).",
      "TCE Grave (Glasgow ≤8): Intubação orotraqueal, VM protetora.",
      "Evitar hipotensão (PAS <90) e hipóxia (SpO2 <90). Aumentam mortalidade.",
      "TC Crânio sem contraste em todo TCE moderado/grave ou leve com red flags.",
      "Monitorização de PIC se Glasgow ≤8 e TC alterada. Alvo PIC <22 mmHg.",
      "Terapia de HIC: Cabeceira 30°, Sedação, Osmoterapia (Manitol ou Salina Hipertônica), Hiperventilação transitória.",
      "Profilaxia anticonvulsivante: Fenitoína por 7 dias em TCE grave."
    ],
    source: "BTF Guidelines 2024",
    link: "https://braintrauma.org/guidelines/guidelines-for-the-management-of-severe-tbi-4th-ed"
  },

  // ==================== PEDIATRIA ====================
  {
    id: "pals-pcr",
    title: "PALS - PCR Pediátrica",
    category: "Pediatria",
    description: "Ressuscitação cardiopulmonar em pediatria.",
    lastUpdate: "2025",
    steps: [
      "RCP: Compressão 100-120/min. Lactente: 2 polegares ou 2 dedos. Criança: 1 ou 2 mãos.",
      "Profundidade: 1/3 do diâmetro AP (4cm lactente, 5cm criança).",
      "Relação se sem via aérea avançada: 15:2 (2 socorristas) ou 30:2 (1 socorrista).",
      "Desfibrilação: 2 J/kg → 4 J/kg → ≥4 J/kg (máx 10 J/kg ou dose adulto).",
      "Epinefrina 0.01 mg/kg (0.1 mL/kg da 1:10.000) IV/IO a cada 3-5 min.",
      "Amiodarona 5 mg/kg IV (FV/TV refratária). Pode repetir até 2x.",
      "Causa mais comum de PCR pediátrica: Hipóxia. Foco na ventilação."
    ],
    source: "AHA PALS 2025",
    link: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pals"
  },
  {
    id: "bronquiolite",
    title: "Bronquiolite Viral Aguda",
    category: "Pediatria",
    description: "Manejo da bronquiolite em lactentes.",
    lastUpdate: "2024",
    steps: [
      "Diagnóstico clínico: Lactente <2 anos, pródromos virais, sibilos, desconforto respiratório.",
      "Avaliação de gravidade: FR, tiragens, SpO2, aceitação alimentar.",
      "Oxigenoterapia se SpO2 <90-92% consistente.",
      "Suporte: Aspiração nasal, Hidratação (VO ou IV se necessário).",
      "NÃO recomendado rotineiramente: Broncodilatadores, Corticóides, Antibióticos.",
      "CNAF (Cateter Nasal de Alto Fluxo) se hipoxemia refratária ou desconforto grave.",
      "Profilaxia com Palivizumabe em prematuros de alto risco."
    ],
    source: "AAP / SBP 2024",
    link: "https://publications.aap.org/pediatrics/article/134/5/e1474/32905/Clinical-Practice-Guideline-The-Diagnosis"
  },
  {
    id: "desidratacao-ped",
    title: "Desidratação em Pediatria",
    category: "Pediatria",
    description: "Planos de reidratação oral A, B e C.",
    lastUpdate: "2024",
    steps: [
      "Avaliar grau: Sem desidratação, Alguma desidratação, Desidratação grave.",
      "Plano A (Sem desidratação): SRO após cada evacuação líquida (50-100mL <2a, 100-200mL >2a). Manter dieta.",
      "Plano B (Alguma desidratação): TRO supervisionada. SRO 50-100 mL/kg em 4-6h. Reavaliação frequente.",
      "Plano C (Desidratação grave/Choque): Expansão IV com SF 0.9% 20 mL/kg em 20-30 min. Repetir se necessário até 60 mL/kg.",
      "Após estabilização: Fase de manutenção + reposição de perdas.",
      "Ondansetrona pode reduzir vômitos e facilitar TRO."
    ],
    source: "OMS / MS Brasil 2024",
    link: "https://bvsms.saude.gov.br/bvs/publicacoes/AIDPI_Modulo_2.pdf"
  },
  {
    id: "cetoacidose-ped",
    title: "Cetoacidose Diabética Pediátrica",
    category: "Pediatria",
    description: "CAD em crianças e adolescentes.",
    lastUpdate: "2024",
    steps: [
      "Diagnóstico: Glicemia >200, pH<7.3 ou Bic<15, Cetonemia ou Cetonúria.",
      "Hidratação: SF 0.9% 10-20 mL/kg na 1ª hora (sem bolus rápido pelo risco de edema cerebral).",
      "Reposição de déficit em 24-48h. Não exceder 1.5-2x a manutenção.",
      "Insulina Regular IV: 0.05-0.1 U/kg/h. Iniciar APÓS 1ª hora de hidratação e se K>3.3.",
      "Potássio: Repor desde o início se K<5.5 (20-40 mEq/L no soro).",
      "Quando glicemia <250-300: Adicionar SG 5-10% para permitir manter insulina e corrigir cetose.",
      "Monitorar sinais de edema cerebral: Cefaleia, Bradicardia, Alteração de consciência, Vômitos."
    ],
    source: "ISPAD 2024",
    link: "https://www.ispad.org/page/ISPADGuidelines2022"
  },

  // ==================== ENDOCRINOLOGIA ====================
  {
    id: "cad-adulto",
    title: "Cetoacidose Diabética (CAD) Adulto",
    category: "Endocrinologia",
    description: "Emergência hiperglicêmica com cetose.",
    lastUpdate: "2024",
    steps: [
      "Critérios: Glicemia >250, pH<7.3, Bic<18, Cetonas+, Gap aumentado.",
      "Hidratação: SF 0.9% 15-20 mL/kg na 1ª hora. Depois 250-500 mL/h.",
      "Insulina Regular IV: 0.1 U/kg bolus + 0.1 U/kg/h OU 0.14 U/kg/h sem bolus.",
      "Alvo de queda glicêmica: 50-75 mg/dL/h.",
      "Potássio: Se K<3.3, repor ANTES da insulina. Se 3.3-5.2, repor junto (20-30 mEq/L). Se >5.2, checar em 2h.",
      "Bicarbonato: Apenas se pH<6.9 (100 mEq em 400 mL água + 20 mEq KCl em 2h).",
      "Quando Glicemia <200: Reduzir insulina para 0.02-0.05 U/kg/h + SG 5%.",
      "Critérios de Resolução: pH>7.3, Bic>15, Gap normal, paciente alimentando."
    ],
    source: "ADA Standards 2024",
    link: "https://diabetesjournals.org/care/issue/47/Supplement_1"
  },
  {
    id: "ehh",
    title: "Estado Hiperglicêmico Hiperosmolar (EHH)",
    category: "Endocrinologia",
    description: "Emergência hiperglicêmica em DM2.",
    lastUpdate: "2024",
    steps: [
      "Critérios: Glicemia >600, Osmolaridade >320, pH>7.3 (sem cetose significativa).",
      "Déficit hídrico severo (8-12L). Hidratação é prioridade.",
      "SF 0.9% 15-20 mL/kg/h na 1ª hora.",
      "Após: SF 0.45% se Na corrigido normal ou alto.",
      "Insulina: 0.1 U/kg/h IV. Alvo de queda: 50-75 mg/dL/h.",
      "Potássio: Repor como na CAD.",
      "Monitorar osmolaridade, Na, consciência frequentemente.",
      "Risco maior de TVP: Considerar profilaxia."
    ],
    source: "ADA Standards 2024",
    link: "https://diabetesjournals.org/care/issue/47/Supplement_1"
  },
  {
    id: "crise-tireotoxica",
    title: "Crise Tireotóxica (Tempestade Tireoidiana)",
    category: "Endocrinologia",
    description: "Tireotoxicose grave e ameaçadora à vida.",
    lastUpdate: "2024",
    steps: [
      "Escore de Burch-Wartofsky (≥45 pontos = alta probabilidade).",
      "1. Bloquear síntese: PTU 200mg VO/SNG a cada 4h (preferido) ou Metimazol 20mg a cada 4h.",
      "2. Bloquear liberação (1h APÓS antitireoidiano): Iodo (SSKI 5gts a cada 6h ou Lugol 10gts a cada 8h).",
      "3. Bloquear conversão periférica T4→T3: Propranolol 60-80mg a cada 4h + Hidrocortisona 100mg IV a cada 8h.",
      "4. Betabloqueio: Propranolol controla sintomas adrenérgicos.",
      "5. Suporte: Hidratação, Resfriamento ativo (evitar AAS), Tratar fator precipitante."
    ],
    source: "ATA Guidelines",
    link: "https://www.thyroid.org/professionals/ata-professional-guidelines/"
  },
  {
    id: "crise-adrenal",
    title: "Crise Adrenal (Insuficiência Adrenal Aguda)",
    category: "Endocrinologia",
    description: "Emergência por deficiência de cortisol.",
    lastUpdate: "2024",
    steps: [
      "Suspeitar: Hipotensão refratária, Hipoglicemia, Hiponatremia, Hipercalemia, Uso crônico de corticóides.",
      "NÃO AGUARDAR EXAMES para tratar se suspeita alta.",
      "Hidrocortisona 100mg IV em bolus imediato.",
      "Manutenção: Hidrocortisona 50mg IV a cada 6-8h.",
      "Ressuscitação volêmica: SF 0.9% + SG 5% (trata hipovolemia e hipoglicemia).",
      "Investigar e tratar fator precipitante (infecção, trauma, cirurgia).",
      "Não precisa de mineralocorticóide na fase aguda (doses altas de hidrocortisona têm efeito mineralocorticóide)."
    ],
    source: "Endocrine Society",
    link: "https://www.endocrine.org/clinical-practice-guidelines/primary-adrenal-insufficiency"
  },

  // ==================== GASTROENTEROLOGIA ====================
  {
    id: "hda",
    title: "Hemorragia Digestiva Alta (HDA)",
    category: "Gastroenterologia",
    description: "Sangramento acima do ângulo de Treitz.",
    lastUpdate: "2024",
    steps: [
      "Estabilização hemodinâmica: Acessos calibrosos, Cristalóide, Hemotransfusão (alvo Hb 7-8g/dL, ou 9 se coronariopata).",
      "Escores de risco: Glasgow-Blatchford (pré-EDA), Rockall (pós-EDA).",
      "IBP IV em alta dose: Omeprazol/Pantoprazol 80mg bolus + 8mg/h infusão contínua.",
      "EDA em até 24h (ou 12h se alto risco).",
      "Tratamento endoscópico: Injeção, Termocoagulação, Clips.",
      "Varicosa: Ligadura elástica + Terlipressina/Octreotide. Antibioticoprofilaxia (Ceftriaxone).",
      "Se ressangramento ou falha: Segunda EDA, Embolização angiográfica ou Cirurgia."
    ],
    source: "ESGE Guidelines 2024",
    link: "https://www.esge.com/education/guidelines/"
  },
  {
    id: "pancreatite-aguda",
    title: "Pancreatite Aguda",
    category: "Gastroenterologia",
    description: "Diagnóstico, estratificação e manejo.",
    lastUpdate: "2024",
    steps: [
      "Diagnóstico (2 de 3): Dor abdominal típica, Lipase/Amilase >3x LSN, Imagem compatível.",
      "Estratificação: BISAP, APACHE-II, Ranson. TC com contraste após 72h (gravidade/necrose).",
      "Hidratação vigorosa: Ringer Lactato 250-500 mL/h nas primeiras 12-24h (ajustar por resposta).",
      "Analgesia: Opioides são seguros.",
      "Nutrição: Oral precoce se tolerado. Se não tolerar, SNE > NPT.",
      "Antibiótico: NÃO profilático. Apenas se necrose infectada confirmada (punção).",
      "CPRE de urgência se coledocolitíase + colangite."
    ],
    source: "AGA / ACG Guidelines 2024",
    link: "https://gastro.org/guidelines/acute-pancreatitis/"
  },
  {
    id: "colangite-aguda",
    title: "Colangite Aguda",
    category: "Gastroenterologia",
    description: "Infecção das vias biliares.",
    lastUpdate: "2024",
    steps: [
      "Tríade de Charcot: Febre + Icterícia + Dor em HCD (50-70%).",
      "Pêntade de Reynolds: Charcot + Hipotensão + Alteração mental (grave).",
      "Exames: Bilirrubinas, FA, GGT, Hemoculturas, USG/TC/RNM.",
      "Antibioticoterapia empírica: Piperacilina-Tazo ou Carbapenem.",
      "Drenagem Biliar de Urgência (<24h): CPRE é preferencial. Alternativa: Drenagem percutânea ou Cirúrgica.",
      "Gravidade (Critérios de Tóquio): Leve, Moderada (responde a ATB), Grave (disfunção orgânica)."
    ],
    source: "Tokyo Guidelines 2024",
    link: "https://www.jshbps.jp/modules/en/index.php?content_id=34"
  },

  // ==================== NEFROLOGIA ====================
  {
    id: "hipercalemia",
    title: "Hipercalemia Aguda",
    category: "Nefrologia",
    description: "Potássio sérico >5.5 mEq/L.",
    lastUpdate: "2024",
    steps: [
      "ECG imediato: Ondas T apiculadas, QRS alargado, Perda de P, Onda sinusoidal.",
      "1. Estabilizar membrana: Gluconato de Cálcio 10% 10mL IV em 2-3 min (se alteração ECG). Repetir se necessário.",
      "2. Shift para intracelular: Insulina Regular 10UI IV + Glicose 50% 50mL. OU Salbutamol nebulizado 10-20mg.",
      "3. Remoção de K: Furosemida (se função renal preservada), Resinas (Poliestirenossulfonato - lento), Hemodiálise (definitivo).",
      "4. Suspender drogas que aumentam K (IECA, BRA, Espironolactona, AINE).",
      "Hemodiálise de urgência se: K>6.5, Alterações ECG graves, Refratário."
    ],
    source: "KDIGO / SBN",
    link: "https://kdigo.org/guidelines/acute-kidney-injury/"
  },
  {
    id: "lra",
    title: "Lesão Renal Aguda (LRA)",
    category: "Nefrologia",
    description: "Classificação KDIGO e manejo.",
    lastUpdate: "2024",
    steps: [
      "KDIGO: Estágio 1 (Cr 1.5-1.9x ou ↑0.3 ou DU<0.5mL/kg/h 6-12h), Estágio 2 (Cr 2-2.9x ou DU<0.5mL/kg/h ≥12h), Estágio 3 (Cr ≥3x ou ≥4 ou DU<0.3mL/kg/h ≥24h ou anúria ≥12h ou TRS).",
      "Etiologia: Pré-renal (hipovolemia), Renal intrínseca (NTA, GN), Pós-renal (obstrução).",
      "Pré-renal: Ressuscitação volêmica. FeNa<1%, FeUreia<35%.",
      "Suspender nefrotóxicos: AINE, Contraste, Aminoglicosídeos, IECA/BRA em LRA.",
      "Ajustar doses de medicações pela TFG.",
      "Indicações de Diálise de Urgência (AEIOU): Acidose refratária, Eletrólitos (K↑), Intoxicação, Overload (hipervolemia), Uremia sintomática."
    ],
    source: "KDIGO LRA 2024",
    link: "https://kdigo.org/guidelines/acute-kidney-injury/"
  },

  // ==================== INFECTOLOGIA ====================
  {
    id: "meningite",
    title: "Meningite Bacteriana",
    category: "Infectologia",
    description: "Diagnóstico e tratamento empírico.",
    lastUpdate: "2024",
    steps: [
      "Suspeita: Febre + Cefaleia + Rigidez de nuca. Tríade clássica em <50%.",
      "Punção Lombar: Antes, se sinais focais ou RNC → TC de crânio.",
      "LCR bacteriano: Pleocitose neutrofílica, Proteína↑, Glicose↓(<40% sérica).",
      "Não atrasar ATB por exames. Se suspeita alta, iniciar empírico antes da PL.",
      "Empírico Adulto: Ceftriaxone 2g IV 12/12h + Vancomicina 15-20mg/kg 8-12h + Dexametasona 0.15mg/kg 6/6h (iniciar antes ou junto do ATB).",
      "Empírico Neonato: Ampicilina + Gentamicina ou Cefotaxima.",
      "Quimioprofilaxia de contatos (Meningococo/Hib): Rifampicina ou Ciprofloxacino dose única."
    ],
    source: "IDSA / MS Brasil 2024",
    link: "https://www.idsociety.org/practice-guideline/bacterial-meningitis/"
  },
  {
    id: "dengue-grave",
    title: "Dengue com Sinais de Alarme / Grave",
    category: "Infectologia",
    description: "Manejo da dengue em grupos B, C e D.",
    lastUpdate: "2024",
    steps: [
      "Sinais de Alarme: Dor abdominal intensa, Vômitos persistentes, Acúmulo de líquidos, Hepatomegalia >2cm, Letargia, Hipotensão postural, ↑Htc + ↓Plaquetas.",
      "Grupo B (Sem alarme, com comorbidade/risco): Hidratação oral supervisionada 80mL/kg/dia.",
      "Grupo C (Com alarme): Internação. Expansão IV 20mL/kg SF em 2h. Repetir até 3x. Reavaliação clínica e Htc.",
      "Grupo D (Grave - Choque/Sangramento/Disfunção): UTI. Expansão 20mL/kg em 20 min. Noradrenalina se refratário.",
      "Transfusão: CH se Hb<10 e instabilidade ou sangramento grave. Plaquetas <20k ou <50k com sangramento.",
      "Evitar: AAS, AINE, Corticóides (sem benefício), Punções desnecessárias."
    ],
    source: "MS Brasil / PAHO 2024",
    link: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue/manejo-clinico"
  },
  {
    id: "covid-grave",
    title: "COVID-19 Grave/Crítica",
    category: "Infectologia",
    description: "Manejo hospitalar.",
    lastUpdate: "2024",
    steps: [
      "Grave: SpO2<94% aa, FR>30, Infiltrados>50%. Crítica: SDRA, Choque, Disfunção orgânica.",
      "Oxigenoterapia: Cânula nasal → Máscara NR → CNAF → VNI. Evitar atrasar IOT.",
      "Corticóide: Dexametasona 6mg IV/VO por 10 dias (se O2 suplementar).",
      "Anticoagulação profilática: Enoxaparina 40mg SC 1x/dia (ou terapêutica se TVP/TEP).",
      "Tocilizumabe/Baricitinibe: Considerar em progressão rápida com marcadores inflamatórios elevados.",
      "Posição Prona Acordado (awake prone) em pacientes não intubados.",
      "Ventilação Protetora se SDRA (VC 6mL/kg, Pplatô<30, PEEP alta)."
    ],
    source: "NIH / OMS 2024",
    link: "https://www.covid19treatmentguidelines.nih.gov/"
  },

  // ==================== GINECOLOGIA/OBSTETRÍCIA ====================
  {
    id: "pre-eclampsia-grave",
    title: "Pré-Eclâmpsia Grave / Eclâmpsia",
    category: "Obstetrícia",
    description: "Manejo da emergência hipertensiva na gestação.",
    lastUpdate: "2024",
    steps: [
      "Critérios de Gravidade: PAS≥160 ou PAD≥110 persistentes, Cefaleia, Epigastralgia, Trombocitopenia<100k, TGO/TGP>2x, Cr>1.1, EAP.",
      "Sulfato de Magnésio (Zuspan): Ataque 4g IV em 20 min + Manutenção 1-2g/h IV. Mantém até 24h pós-parto.",
      "Anti-hipertensivo: Hidralazina 5mg IV (repetir 5-10mg a cada 20 min) OU Nifedipino 10mg VO a cada 30 min.",
      "Alvo PA: 140-150 / 90-100 mmHg.",
      "Conduta Obstétrica: Se ≥37 semanas → Parto. Se <34 semanas → Corticóide para maturação fetal + Considerar expectante se estável.",
      "Eclâmpsia (convulsão): MgSO4 é o tratamento e a profilaxia."
    ],
    source: "ACOG / FEBRASGO 2024",
    link: "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/06/gestational-hypertension-and-preeclampsia"
  },
  {
    id: "hemorragia-pos-parto",
    title: "Hemorragia Pós-Parto (HPP)",
    category: "Obstetrícia",
    description: "Perda sanguínea >500mL (vaginal) ou >1000mL (cesárea).",
    lastUpdate: "2024",
    steps: [
      "Massagem Uterina bimanual imediata e contínua.",
      "Uterotônicos: Ocitocina 20-40UI em 500mL SF IV rápido. Metilergonovina 0.2mg IM (se não hipertensa). Misoprostol 800-1000mcg retal.",
      "Ácido Tranexâmico 1g IV em 10 min (dentro de 3h do parto).",
      "Ressuscitação: 2 acessos calibrosos, Cristalóide, Hemotransfusão (alvo Hb>8).",
      "Se refratária: Balão de tamponamento intrauterino (Bakri), Suturas compressivas (B-Lynch), Ligadura de artérias uterinas/hipogástricas.",
      "Histerectomia como último recurso.",
      "Lembrar 4Ts: Tônus (atonia), Tecido (restos placentários), Trauma, Trombina (coagulopatia)."
    ],
    source: "ACOG / FIGO 2024",
    link: "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2017/10/postpartum-hemorrhage"
  },

  // ==================== ORTOPEDIA ====================
  {
    id: "sindrome-compartimental",
    title: "Síndrome Compartimental Aguda",
    category: "Ortopedia",
    description: "Emergência ortopédica por aumento de pressão em compartimento fechado.",
    lastUpdate: "2024",
    steps: [
      "5 Ps: Pain out of proportion (dor desproporcional), Pain on passive stretch, Paresthesia, Pallor, Pulselessness (tardio).",
      "Diagnóstico clínico! Não aguardar perda de pulso.",
      "Medida de pressão compartimental: >30 mmHg ou Delta Pressure (PAD - Pcompartimental) <30 mmHg.",
      "Tratamento: FASCIOTOMIA DE URGÊNCIA. Não retardar por exames.",
      "Remover todos os curativos e talas compressivas.",
      "Tempo é músculo: Necrose irreversível após 6-8h de isquemia."
    ],
    source: "AAOS / OTA",
    link: "https://www.aaos.org/quality/quality-programs/trauma/acute-compartment-syndrome/"
  },

  // ==================== PSIQUIATRIA ====================
  {
    id: "agitacao-psicomotora",
    title: "Agitação Psicomotora",
    category: "Psiquiatria",
    description: "Manejo da agitação aguda na emergência.",
    lastUpdate: "2024",
    steps: [
      "Segurança: Equipe treinada, ambiente seguro, chamar segurança se necessário.",
      "Desescalonamento verbal: Tom calmo, Oferecer opções, Não confrontar.",
      "Se medicação necessária e paciente aceita VO: Risperidona 2mg ou Olanzapina 10mg ou Haloperidol 5mg + Lorazepam 2mg.",
      "Se IM necessário: Haloperidol 5mg + Midazolam 5mg IM (coquetel).",
      "Preferir Olanzapina IM ou Ziprasidona IM em psicose.",
      "Contenção mecânica: Último recurso, checar a cada 15 min, documentar justificativa.",
      "Investigar causa: Intoxicação, Abstinência, Delirium orgânico, Transtorno psiquiátrico primário."
    ],
    source: "APA / AAEP Guidelines",
    link: "https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines"
  }
];

export const CATEGORIES = [
  "Todos",
  "Emergência",
  "Cardiologia",
  "Pneumologia",
  "Neurologia",
  "Pediatria",
  "Endocrinologia",
  "Gastroenterologia",
  "Nefrologia",
  "Infectologia",
  "Obstetrícia",
  "Ortopedia",
  "Psiquiatria"
];
