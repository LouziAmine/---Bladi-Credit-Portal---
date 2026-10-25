import {
  ProcessEntity,
  StepEntity,
  WorkflowEntity,
  WorkflowProcessEntity,
  WorkflowProcessStepEntity,
} from '../core/workflow-entities';

export const SEED_PROCESSES: ProcessEntity[] = [
  { id: 1, code: 'INITIATION', name: 'Initiation du dossier' },
  { id: 2, code: 'INSTRUCTION', name: 'Instruction / Avis plateforme' },
  { id: 3, code: 'RISK_ANALYSIS', name: 'Analyse contre-risque' },
  { id: 4, code: 'DECISION', name: 'Decision' },
  { id: 5, code: 'GUARANTEES', name: 'Assurances et gestion des garanties' },
  { id: 6, code: 'CONTRACT_EDITION', name: 'Edition des contrats' },
  { id: 7, code: 'CLASSIFICATION', name: 'Classification du dossier' },
  { id: 8, code: 'MORTGAGE_VERIFICATION', name: 'Vérification du dossier' },
  { id: 9, code: 'MORTGAGE_INSTRUCTION', name: 'Instruction' },
  { id: 10, code: 'MORTGAGE_DECISION', name: 'Décision' },
  { id: 11, code: 'MORTGAGE_EDITION', name: "Édition de l'offre" },
  { id: 12, code: 'MORTGAGE_GUARANTEES', name: 'Garanties' },
  { id: 13, code: 'MORTGAGE_DISBURSEMENT', name: 'Déblocage des fonds' },
];

type StepRow = [number, string, string, string | null, number | null, boolean, boolean, string | null];
const STEP_ROWS: StepRow[] = [
  [1, 'INITIATION_STEP', 'Création du dossier et ouverture des lignes', "Chargé d'affaires", 1, false, false, null],
  [2, 'INSTRUCTION_TS_STEP', 'Préparation et validation de la TS indicative', "Chargé d'investissement / Responsables PPIF", 2, false, false, null],
  [3, 'INSTRUCTION_MONTAGE_STEP', 'Montage du dossier', "Chargé d'investissement", 2, false, false, null],
  [4, 'INSTRUCTION_VALIDATION_STEP', 'Validation du dossier (PPIF et Réseau)', 'Responsables PPIF et Réseau', 6, false, false, null],
  [5, 'RISK_RECEPTION_STEP', 'Réception du dossier et affectation', 'Responsable Département/Direction PAE', 4, false, false, null],
  [6, 'RISK_ANALYSIS_STEP', 'Contre-analyse du dossier de crédit', 'Analyste PAE', 3, false, false, null],
  [7, 'RISK_VALIDATION_DEPT_STEP', 'Validation de la contre-analyse (Responsable Département)', 'Responsable Département PAE', 4, false, false, null],
  [8, 'RISK_VALIDATION_DIR_STEP', 'Validation de la contre-analyse (Responsable Direction)', 'Responsable Direction PAE', 5, false, false, null],
  [9, 'RISK_COMMITTEE_PROG_STEP', 'Programmation du comité', 'Support Administratif', 7, false, false, null],
  [10, 'DECISION_STEP', 'Décision comité (Tournant ou Séance Tenante)', 'Décideurs désignés / PAE', 8, false, false, 'DEMAND_IN_DECISION'],
  [11, 'GUARANTEES_NOTIF_STEP', 'Notification des garanties', 'Gestionnaire OGS Garanties', 10, false, false, null],
  [12, 'GUARANTEES_MISE_EN_GESTION_STEP', 'Mise en gestion du dossier', 'Gestionnaire OGS Mise en gestion', 10, false, false, null],
  [13, 'CONTRACT_EDITION_STEP', 'Edition des contrats', 'Support Administratif', 7, false, false, null],
  [14, 'CONTRACT_SIGNATURE_STEP', 'Signature des contrats', "Chargé d'affaires", 1, false, false, null],
  [15, 'CLASSIFICATION_STEP', 'Validation initiale du dossier avec le client', "Chargé d'affaires", 1, true, false, null],
  [16, 'INSURANCE_VALIDATION_STEP', 'Souscription et validation des assurances', 'Gestionnaire OGS Garanties', 10, false, true, null],
  [17, 'MORTGAGE_INSTRUCTION_STEP', 'Étude du dossier et calcul définitif', 'Chargé de clientèle', 1, false, false, null],
  [18, 'MORTGAGE_DECISION_STEP', 'Décision agence/direction', "Directeur d'agence", 6, false, false, 'DEMAND_IN_DECISION'],
  [19, 'MORTGAGE_EDITION_STEP', "Édition de l'offre de prêt", 'Support Administratif', 7, false, false, null],
  [20, 'MORTGAGE_GUARANTEE_STEP', 'Garantie hypothécaire / notaire', 'Chargé de clientèle', 1, false, false, null],
  [21, 'MORTGAGE_DISBURSEMENT_STEP', 'Déblocage des fonds', 'Support Administratif', 7, false, false, null],
];
const FOUR_EYES_CODES = new Set(['DECISION_STEP', 'MORTGAGE_DECISION_STEP']);
export const SEED_STEPS: StepEntity[] = STEP_ROWS.map(
  ([id, code, name, typicalRole, requiredGradeId, requiresClassification, requiresInsuranceConfirmation, notifyContactOnEnterType]) => ({
    id,
    code,
    name,
    typicalRole,
    requiredGradeId,
    requiresClassification,
    requiresInsuranceConfirmation,
    requiresFourEyes: FOUR_EYES_CODES.has(code),
    notifyContactOnEnterType,
  }),
);

export const SEED_WORKFLOWS: WorkflowEntity[] = [
  { id: 1, code: 'PME_INVESTMENT', name: 'Petite Entreprise - Investissement', active: true },
  { id: 2, code: 'GE_INVESTMENT', name: 'Grande Entreprise - Investissement', active: true },
  { id: 3, code: 'MORTGAGE_RETAIL', name: 'Crédit Immobilier - Particulier', active: true },
];

const WP_ROWS: [number, number, number, number][] = [
  [1, 1, 1, 1], [2, 1, 2, 2], [3, 1, 3, 3], [4, 1, 4, 4], [5, 1, 5, 6],
  [6, 2, 1, 1], [7, 2, 2, 2], [8, 2, 3, 3], [9, 2, 4, 4], [10, 2, 5, 6],
  [11, 1, 6, 5], [12, 2, 6, 5], [13, 1, 7, 0], [14, 2, 7, 0],
  [15, 3, 8, 1], [16, 3, 9, 2], [17, 3, 10, 3], [18, 3, 11, 4], [19, 3, 12, 5], [20, 3, 13, 6],
];
export const SEED_WORKFLOW_PROCESSES: WorkflowProcessEntity[] = WP_ROWS.map(([id, workflowId, processId, sequenceOrder]) => ({
  id,
  workflowId,
  processId,
  sequenceOrder,
}));

const WPS_ROWS: [number, number, number, number, number | null][] = [
  [1, 1, 1, 1, 1], [2, 2, 2, 1, 2], [3, 2, 3, 2, 2], [4, 2, 4, 3, 2],
  [5, 3, 5, 1, 5], [6, 3, 6, 2, 5], [7, 3, 7, 3, 5], [8, 3, 8, 4, 5], [9, 3, 9, 5, 5],
  [10, 4, 10, 1, 5], [11, 5, 11, 2, 6], [12, 5, 12, 3, 7],
  [13, 6, 1, 1, 1], [14, 7, 2, 1, 3], [15, 7, 3, 2, 3], [16, 7, 4, 3, 3],
  [17, 8, 5, 1, 5], [18, 8, 6, 2, 5], [19, 8, 7, 3, 5], [20, 8, 8, 4, 5], [21, 8, 9, 5, 5],
  [22, 9, 10, 1, 5], [23, 10, 11, 2, 6], [24, 10, 12, 3, 7],
  [25, 11, 13, 1, 5], [26, 12, 13, 1, 5], [27, 11, 14, 2, 1], [28, 12, 14, 2, 1],
  [29, 13, 15, 1, 1], [30, 14, 15, 1, 1], [31, 5, 16, 1, 6], [32, 10, 16, 1, 6],
  [33, 15, 15, 1, 1], [34, 16, 17, 1, 1], [35, 17, 18, 1, 2], [36, 18, 19, 1, 5],
  [37, 19, 20, 1, 1], [38, 20, 21, 1, 5],
];
export const SEED_WORKFLOW_PROCESS_STEPS: WorkflowProcessStepEntity[] = WPS_ROWS.map(
  ([id, workflowProcessId, stepId, sequenceOrder, requiredTeamId]) => ({
    id,
    workflowProcessId,
    stepId,
    sequenceOrder,
    requiredTeamId,
  }),
);
