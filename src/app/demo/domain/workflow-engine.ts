import { getAll, nextId, put } from '../core/demo-db';
import { conflict, cryptoRandomId, forbidden, notFound, serviceUnavailable, unprocessable } from '../core/demo-result';
import { UserEntity, InvestmentCreditParametersEntity, BamParametersEntity } from '../core/entities';
import {
  DemandAssignmentEntity,
  DemandEntity,
  EnterpriseDemandDetail,
  MortgageDemandDetail,
  StepInfo,
  StepInstanceEntity,
  WorkflowEntity,
} from '../core/workflow-entities';
import {
  allStepsForWorkflow,
  demandStatus,
  findOpenStepInstance,
  firstStep,
  generateReference,
  getDemand,
  hasClosedAnyStep,
  nextStep,
  openStepInstance,
  previousStep,
  saveDemand,
  saveStepInstance,
  stepInfoByWpsId,
} from './workflow-repo';
import * as calc from './calc-engine';
import { resolveBorrowerForClassification, resolveClientForClassification } from './client-domain';
import { createNotification } from './notifications';
import { openCreditFile } from './servicing';

async function notifyAssignee(username: string | null, demand: DemandEntity, stepName: string): Promise<void> {
  if (!username || !username.trim()) {
    return;
  }
  await createNotification(
    username,
    'DEMAND_ASSIGNED',
    'Dossier à traiter',
    `Le dossier ${demand.reference} vous a été assigné à l'étape « ${stepName} ».`,
    `/admin/demands/${demand.publicId}`,
  );
}

const MAX_LEGAL_RATE = 14.0;
const SUPERVISOR_GRADE_CODE = 'SUPERVISEUR';

export interface DemandSnapshot {
  demandType: 'ENTERPRISE' | 'MORTGAGE';
  contactName: string;
  amount: number;
  duration: number;
  applicableRate: number;
  contactEmail: string | null;
  contactPhone: string | null;
  contactLanguage: string | null;
  enterpriseDetail?: EnterpriseDemandDetail;
  mortgageDetail?: MortgageDemandDetail;
}

export interface StepClosureDetails {
  note: string | null;
  decisionOutcome: 'APPROVED' | 'DEFERRED' | 'REJECTED' | null;
  returnReasonCode: string | null;
  recommendations: string | null;
  reserves: string | null;
  committeeType: string | null;
  insuranceAdiSubscribed: boolean | null;
  insuranceCoverageType: string | null;
  insuranceDamageSubscribed: boolean | null;
  rateOption: 'KEEP' | 'MANUAL';
  manualRate: number | null;
  amountOption: 'KEEP' | 'MANUAL';
  manualAmount: number | null;
  durationOption: 'KEEP' | 'MANUAL';
  manualDuration: number | null;
}

function pct(ratio: number): string {
  const v = Math.round(ratio * 10000) / 100;
  return Number.isInteger(v) ? String(v) : String(v);
}

async function userByUsername(username: string): Promise<UserEntity> {
  const users = await getAll<UserEntity>('users');
  const u = users.find((x) => x.username === username);
  if (!u) {
    throw notFound(`Utilisateur introuvable : ${username}`);
  }
  return u;
}

function userGradeCode(u: UserEntity, grades: { id: number; code: string }[]): string | null {
  return u.gradeId != null ? grades.find((g) => g.id === u.gradeId)?.code ?? null : null;
}

function isEligibleFor(u: UserEntity, step: StepInfo): boolean {
  return u.gradeId != null && u.gradeId === step.requiredGradeId && u.teamId != null && u.teamId === step.requiredTeamId;
}
function isMemberOf(u: UserEntity, team: number | null): boolean {
  return team != null && u.teamId === team;
}
async function isSupervisorOf(u: UserEntity, team: number | null): Promise<boolean> {
  if (!isMemberOf(u, team)) {
    return false;
  }
  const grades = await getAll<{ id: number; code: string }>('grades');
  return userGradeCode(u, grades) === SUPERVISOR_GRADE_CODE;
}

async function resolveWorkflowId(snapshot: DemandSnapshot): Promise<number> {
  let code: string;
  if (snapshot.demandType === 'MORTGAGE') {
    code = 'MORTGAGE_RETAIL';
  } else {
    const type = snapshot.enterpriseDetail!.enterpriseType;
    code = type === 'ETI' || type === 'GE' ? 'GE_INVESTMENT' : 'PME_INVESTMENT';
  }
  const workflows = await getAll<WorkflowEntity>('workflows');
  const wf = workflows.find((w) => w.code === code && w.active);
  if (!wf) {
    throw serviceUnavailable("Aucun circuit de traitement actif n'est configuré pour ce type d'entreprise.");
  }
  return wf.id;
}

export async function openDemandFromSimulation(snapshot: DemandSnapshot): Promise<DemandEntity> {
  const workflowId = await resolveWorkflowId(snapshot);
  const duplicate = await findUnclassifiedDuplicate(snapshot, workflowId);
  if (duplicate) {
    return duplicate;
  }
  return openNewDemand(snapshot, workflowId);
}

export async function createDemand(snapshot: DemandSnapshot): Promise<DemandEntity> {
  const workflowId = await resolveWorkflowId(snapshot);
  return openNewDemand(snapshot, workflowId);
}

async function openNewDemand(snapshot: DemandSnapshot, workflowId: number): Promise<DemandEntity> {
  const first = await firstStep(workflowId);
  if (!first) {
    throw serviceUnavailable("Aucun circuit de traitement actif n'est configuré pour ce type d'entreprise.");
  }
  const now = new Date().toISOString();
  const id = await nextId('demands');
  const demand: DemandEntity = {
    id,
    publicId: cryptoRandomId(),
    reference: generateReference(),
    workflowId,
    demandType: snapshot.demandType,
    contactName: snapshot.contactName,
    amount: snapshot.amount,
    duration: snapshot.duration,
    createdAt: now,
    completedAt: null,
    applicableRate: snapshot.applicableRate,
    contactEmail: snapshot.contactEmail,
    contactPhone: snapshot.contactPhone,
    contactLanguage: snapshot.contactLanguage,
    rejectedAt: null,
    enterpriseDetail: snapshot.enterpriseDetail ?? null,
    mortgageDetail: snapshot.mortgageDetail ?? null,
  };
  await saveDemand(demand);
  await openStepInstance(id, first.workflowProcessStepId, null, null, now);
  return demand;
}

async function findUnclassifiedDuplicate(snapshot: DemandSnapshot, workflowId: number): Promise<DemandEntity | null> {
  if (!snapshot.contactEmail || !snapshot.contactName) {
    return null;
  }
  const demands = await getAll<DemandEntity>('demands');
  const candidate = demands.find(
    (d) =>
      d.demandType === snapshot.demandType &&
      d.contactEmail === snapshot.contactEmail &&
      d.contactName === snapshot.contactName &&
      demandStatus(d) === 'IN_PROGRESS' &&
      d.workflowId === workflowId,
  );
  if (!candidate) {
    return null;
  }
  const open = await findOpenStepInstance(candidate.id);
  if (!open) {
    return null;
  }
  const info = await stepInfoByWpsId(open.workflowProcessStepId);
  if (!info?.requiresClassification) {
    return null;
  }

  candidate.amount = snapshot.amount;
  candidate.duration = snapshot.duration;
  candidate.applicableRate = snapshot.applicableRate;
  candidate.contactPhone = snapshot.contactPhone;
  if (snapshot.contactLanguage) {
    candidate.contactLanguage = snapshot.contactLanguage;
  }
  candidate.enterpriseDetail = snapshot.enterpriseDetail ?? candidate.enterpriseDetail;
  candidate.mortgageDetail = snapshot.mortgageDetail ?? candidate.mortgageDetail;
  await saveDemand(candidate);
  return candidate;
}

function overridesTerms(d: StepClosureDetails): boolean {
  return d.rateOption === 'MANUAL' || d.amountOption === 'MANUAL' || d.durationOption === 'MANUAL';
}
function isReturnForCompletion(d: StepClosureDetails): boolean {
  return d.returnReasonCode != null;
}
function isRefusal(d: StepClosureDetails): boolean {
  return !isReturnForCompletion(d) && d.decisionOutcome === 'REJECTED';
}
function isDeferralMovingForward(d: StepClosureDetails): boolean {
  return !isReturnForCompletion(d) && d.decisionOutcome === 'DEFERRED';
}

interface Decisions {
  rateOption: string;
  previousRate: number | null;
  appliedRate: number;
  amountOption: string;
  previousAmount: number;
  appliedAmount: number;
  durationOption: string;
  previousDuration: number;
  appliedDuration: number;
}

function decide(details: StepClosureDetails, demand: DemandEntity): Decisions {
  let appliedRate: number;
  if (details.rateOption === 'KEEP') {
    if (demand.applicableRate == null) {
      throw conflict(
        "Ce dossier n'a pas encore de taux applicable actuel (créé avant l'existence de ce champ, ou jamais avancé): rateOption=KEEP n'est pas disponible ; choisissez MANUAL à la place.",
      );
    }
    appliedRate = demand.applicableRate;
  } else {
    if (details.manualRate == null) {
      throw unprocessable('manualRate est requis lorsque rateOption=MANUAL.');
    }
    appliedRate = details.manualRate;
  }
  let appliedAmount = demand.amount;
  if (details.amountOption === 'MANUAL') {
    if (details.manualAmount == null) {
      throw unprocessable('manualAmount est requis lorsque amountOption=MANUAL.');
    }
    appliedAmount = details.manualAmount;
  }
  let appliedDuration = demand.duration;
  if (details.durationOption === 'MANUAL') {
    if (details.manualDuration == null) {
      throw unprocessable('manualDuration est requis lorsque durationOption=MANUAL.');
    }
    appliedDuration = details.manualDuration;
  }
  return {
    rateOption: details.rateOption,
    previousRate: demand.applicableRate,
    appliedRate,
    amountOption: details.amountOption,
    previousAmount: demand.amount,
    appliedAmount,
    durationOption: details.durationOption,
    previousDuration: demand.duration,
    appliedDuration,
  };
}

function recordClosure(open: StepInstanceEntity, details: StepClosureDetails, decisions: Decisions, actor: string, now: string): void {
  open.exitedAt = now;
  open.decisionNote = details.note;
  open.decisionOutcome = details.decisionOutcome;
  open.returnReasonCode = details.returnReasonCode;
  open.recommendations = details.recommendations;
  open.reserves = details.reserves;
  open.committeeType = details.committeeType;
  open.insuranceAdiSubscribed = details.insuranceAdiSubscribed;
  open.insuranceCoverageType = details.insuranceCoverageType;
  open.insuranceDamageSubscribed = details.insuranceDamageSubscribed;
  open.rateOption = decisions.rateOption;
  open.previousRate = decisions.previousRate;
  open.appliedRate = decisions.appliedRate;
  open.rateChangedBy = actor;
  open.closedBy = actor;
  open.amountOption = decisions.amountOption;
  open.previousAmount = decisions.previousAmount;
  open.appliedAmount = decisions.appliedAmount;
  open.durationOption = decisions.durationOption;
  open.previousDuration = decisions.previousDuration;
  open.appliedDuration = decisions.appliedDuration;
}

export async function advance(
  demandId: number,
  details: StepClosureDetails,
  assigneeUsername: string | null,
  actor: string,
): Promise<DemandEntity> {
  const demand = await getDemand(demandId);
  if (!demand) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  if (demandStatus(demand) !== 'IN_PROGRESS') {
    throw conflict('Ce dossier est déjà à sa dernière étape et ne peut plus être avancé.');
  }
  const open = await findOpenStepInstance(demandId);
  if (!open) {
    throw notFound('Étape de circuit introuvable pour ce dossier.');
  }
  const current = await stepInfoByWpsId(open.workflowProcessStepId);
  if (!current) {
    throw notFound('Étape de circuit introuvable pour ce dossier.');
  }
  if (current.requiresClassification) {
    throw conflict("Ce dossier est encore à l'étape CLASSIFICATION_STEP: utilisez POST /{id}/classify au lieu de /advance.");
  }
  await assertActorEligibleForStep(actor, current, open.assignedUsername);
  if (isDeferralMovingForward(details)) {
    throw conflict(
      "Le comité a ajourné ce dossier (decisionOutcome=DEFERRED) : il ne peut pas avancer vers l'étape suivante: renvoyez-le pour complément avec un returnReasonCode.",
    );
  }
  if (!isReturnForCompletion(details)) {
    await assertFourEyes(demandId, current, actor);
  }
  if (overridesTerms(details) && (await isPastCommitteeDecision(demand.workflowId, current))) {
    throw conflict(
      'Les conditions (montant, taux, durée) ont été fixées par la décision du comité et ne peuvent plus être modifiées à cette étape. Renvoyez le dossier à l’étape de décision pour les changer.',
    );
  }

  const decisions = decide(details, demand);
  if (decisions.appliedRate > MAX_LEGAL_RATE) {
    throw unprocessable('Le taux saisi dépasse le taux maximum des intérêts conventionnels fixé par Bank Al-Maghrib.');
  }

  const now = new Date().toISOString();
  if (isRefusal(details)) {
    recordClosure(open, details, decisions, actor, now);
    await saveStepInstance(open);
    demand.rejectedAt = now;
    await saveDemand(demand);
    return (await getDemand(demandId))!;
  }

  await assertTermsAcceptable(demand, details, decisions, current);

  const returnedForCompletion = isReturnForCompletion(details);
  const destination = returnedForCompletion
    ? (await previousStep(demand.workflowId, current.globalOrder)) ??
      (() => {
        throw conflict('Ce dossier est déjà à sa première étape et ne peut plus être retourné pour complément.');
      })()
    : await nextStep(demand.workflowId, current.globalOrder);
  if (destination) {
    await assertEligibleNextAssignee(actor, assigneeUsername, destination);
  }

  recordClosure(open, details, decisions, actor, now);
  await saveStepInstance(open);

  demand.applicableRate = decisions.appliedRate;
  demand.amount = decisions.appliedAmount;
  demand.duration = decisions.appliedDuration;
  let completed = false;
  if (destination) {
    await openStepInstance(demandId, destination.workflowProcessStepId, assigneeUsername, actor, now);
    await notifyAssignee(assigneeUsername, demand, destination.stepName);
  } else {
    demand.completedAt = now;
    completed = true;
  }
  await saveDemand(demand);

  if (completed) {
    await openCreditFile(demandId, actor);
  }
  return (await getDemand(demandId))!;
}

async function isPastCommitteeDecision(workflowId: number, current: StepInfo): Promise<boolean> {
  const steps = await allStepsForWorkflow(workflowId);
  return steps.some((s) => s.requiresFourEyes && s.globalOrder < current.globalOrder);
}

async function assertActorEligibleForStep(username: string, step: StepInfo, assignedUsername: string | null): Promise<void> {
  if (assignedUsername != null) {
    if (assignedUsername !== username) {
      throw forbidden("Cette étape est assignée à un autre utilisateur: demandez-lui de vous la réassigner via POST /assign.");
    }
    return;
  }
  if (step.requiredGradeId == null || step.requiredTeamId == null) {
    return;
  }
  const actor = await userByUsername(username);
  const hasGradeAndTeam = actor.gradeId != null && actor.teamId != null;
  if (hasGradeAndTeam && !isEligibleFor(actor, step)) {
    throw forbidden("Votre profil grade/équipe ne correspond pas à celui requis par l'étape actuelle de ce dossier.");
  }
}

async function assertFourEyes(demandId: number, step: StepInfo, username: string): Promise<void> {
  if (step.requiresFourEyes && (await hasClosedAnyStep(demandId, username))) {
    throw forbidden(
      'Principe des quatre yeux : vous avez déjà traité une étape précédente de ce dossier, la décision doit être prise par une autre personne.',
    );
  }
}

async function assertEligibleNextAssignee(actorUsername: string, assigneeUsername: string | null, destination: StepInfo): Promise<void> {
  if (destination.requiredGradeId == null || destination.requiredTeamId == null) {
    if (assigneeUsername && assigneeUsername.trim()) {
      await requireStaff(assigneeUsername);
    }
    return;
  }
  if (!assigneeUsername || !assigneeUsername.trim()) {
    throw unprocessable(
      "assigneeUsername est requis : un dossier ne peut avancer ou revenir à une étape sans désigner qui en prend la responsabilité, sauf si le dossier est en cours de finalisation.",
    );
  }
  const actor = await userByUsername(actorUsername);
  const nextAssignee = await userByUsername(assigneeUsername);
  const eligible = (await isSupervisorOf(actor, destination.requiredTeamId))
    ? isMemberOf(nextAssignee, destination.requiredTeamId)
    : isEligibleFor(nextAssignee, destination);
  if (!eligible) {
    throw forbidden("Le profil grade/équipe de l'utilisateur cible ne correspond pas à celui requis par l'étape actuelle de ce dossier.");
  }
}

async function requireStaff(username: string): Promise<UserEntity> {
  const u = await userByUsername(username);
  if (u.role !== 'MANAGER') {
    throw forbidden("Le profil grade/équipe de l'utilisateur cible ne correspond pas à celui requis par l'étape actuelle de ce dossier.");
  }
  return u;
}

async function assertTermsAcceptable(demand: DemandEntity, details: StepClosureDetails, decisions: Decisions, current: StepInfo): Promise<void> {
  if (overridesTerms(details)) {
    await assertEligible(demand, decisions.appliedAmount, decisions.appliedRate, decisions.appliedDuration);
  }
  if (!isReturnForCompletion(details) && current.requiresInsuranceConfirmation) {
    assertInsuranceValidated(details, demand);
  }
}

async function assertEligible(demand: DemandEntity, amount: number, rate: number, duration: number): Promise<void> {
  if (demand.demandType === 'ENTERPRISE') {
    const detail = demand.enterpriseDetail!;
    const params = (await getAll<InvestmentCreditParametersEntity>('investmentCreditParameters')).find(
      (p) => p.enterpriseType === detail.enterpriseType && p.active,
    );
    if (!params) {
      throw serviceUnavailable("Les paramètres de crédit entreprise ne sont pas configurés pour ce type d'entreprise.");
    }
    if (detail.annualRevenue != null && amount > calc.money(detail.annualRevenue * params.maxFinancingToRevenueRatio)) {
      throw unprocessable(`Le montant demandé dépasse ${pct(params.maxFinancingToRevenueRatio)} % du chiffre d'affaires annuel.`);
    }
    if (detail.guaranteesValue != null && detail.guaranteesValue < calc.money(amount * params.minGuaranteeCoverageRatio)) {
      throw unprocessable(`Les garanties proposées couvrent moins de ${pct(params.minGuaranteeCoverageRatio)} % du montant demandé.`);
    }
    if (detail.existingAnnualDebtService != null && detail.netAnnualResult != null) {
      const snapshot = calc.computeInvestmentAtRate(amount, rate, duration, {
        processingFeesRatio: params.processingFeesRatio,
        insurancePremiumRatio: params.insurancePremiumRatio,
      });
      const totalAnnualDebtService = calc.money(detail.existingAnnualDebtService + snapshot.annualDebtService);
      if (totalAnnualDebtService > calc.money(detail.netAnnualResult * params.maxDebtServiceRatio)) {
        throw unprocessable(`Le service de la dette annuel total dépasse ${pct(params.maxDebtServiceRatio)} % du résultat net annuel.`);
      }
    }
    return;
  }

  const detail = demand.mortgageDetail!;
  const bam = (await getAll<BamParametersEntity>('bamParameters')).find((b) => b.active);
  if (!bam) {
    throw serviceUnavailable('Les paramètres de frais BAM ne sont pas configurés.');
  }
  if (detail.propertyValue != null) {
    assertWithinLtv(amount, detail.propertyValue, bam);
  }
  if (detail.age != null) {
    assertEligibleAge(detail.age, duration, bam);
  }
}

function assertWithinLtv(loan: number, propertyValue: number, bam: BamParametersEntity): void {
  const maxLoan = calc.money(propertyValue * bam.ltvRatio);
  if (loan > maxLoan) {
    throw unprocessable(`Le montant du prêt dépasse ${pct(bam.ltvRatio)} % de la valeur du bien. Un apport minimum de ${pct(1 - bam.ltvRatio)} % est requis (réglementation BAM).`);
  }
}
function assertEligibleAge(currentAge: number, durationMonths: number, bam: BamParametersEntity): void {
  const ageAtMaturity = currentAge + Math.ceil(durationMonths / 12);
  if (ageAtMaturity > bam.maxAgeAtMaturity) {
    throw unprocessable("L'échéance du crédit dépasse l'âge maximum autorisé à l'échéance (réglementation BAM).");
  }
}

function assertInsuranceValidated(details: StepClosureDetails, demand: DemandEntity): void {
  if (details.insuranceAdiSubscribed !== true) {
    throw unprocessable("insuranceAdiSubscribed doit être à true pour avancer au-delà de l'étape INSURANCE_VALIDATION_STEP.");
  }
  if (demand.demandType === 'ENTERPRISE') {
    const g = demand.enterpriseDetail?.guaranteesValue;
    if (g != null && g > 0 && details.insuranceDamageSubscribed !== true) {
      throw unprocessable(
        "insuranceDamageSubscribed doit être à true pour avancer au-delà de l'étape INSURANCE_VALIDATION_STEP lorsque le dossier a une valeur de garanties non nulle.",
      );
    }
  }
}

export async function classify(
  demandId: number,
  outcome: 'REAL' | 'FAKE' | 'SIMULATION_ONLY',
  enterprisePublicId: string | null,
  note: string | null,
  assigneeUsername: string | null,
  actor: string,
): Promise<DemandEntity> {
  const demand = await getDemand(demandId);
  if (!demand) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  const open = await findOpenStepInstance(demandId);
  const current = open ? await stepInfoByWpsId(open.workflowProcessStepId) : null;
  if (!open || !current || !current.requiresClassification) {
    throw conflict("Ce dossier n'est actuellement pas à l'étape CLASSIFICATION_STEP: POST /classify ne s'applique qu'à la toute première étape d'un dossier.");
  }
  await assertActorEligibleForStep(actor, current, open.assignedUsername);
  const now = new Date().toISOString();

  if (outcome !== 'REAL') {
    open.exitedAt = now;
    open.closedBy = actor;
    open.decisionNote = note;
    open.classificationOutcome = outcome;
    await saveStepInstance(open);
    demand.rejectedAt = now;
    await saveDemand(demand);
    return (await getDemand(demandId))!;
  }

  if (demand.demandType === 'ENTERPRISE' && !enterprisePublicId) {
    throw unprocessable('enterpriseId est requis lorsque classificationOutcome=REAL.');
  }
  let enterpriseId: number | null = null;
  if (demand.demandType === 'ENTERPRISE') {
    const enterprises = await getAll<{ id: number; publicId: string }>('enterprises');
    const ent = enterprises.find((e) => e.publicId === enterprisePublicId);
    if (!ent) {
      throw notFound("Entreprise introuvable.");
    }
    enterpriseId = ent.id;
  }
  const destination = await nextStep(demand.workflowId, current.globalOrder);
  if (!destination) {
    throw conflict('Ce dossier est déjà à sa dernière étape et ne peut plus être avancé.');
  }
  await assertEligibleNextAssignee(actor, assigneeUsername, destination);

  open.exitedAt = now;
  open.closedBy = actor;
  open.decisionNote = note;
  open.classificationOutcome = 'REAL';
  await saveStepInstance(open);
  if (enterpriseId != null && demand.enterpriseDetail) {
    demand.enterpriseDetail.enterpriseId = enterpriseId;
  }
  await saveDemand(demand);
  await openStepInstance(demandId, destination.workflowProcessStepId, assigneeUsername, actor, now);
  await notifyAssignee(assigneeUsername, demand, destination.stepName);

  if (enterpriseId != null) {
    await resolveClientForClassification(enterpriseId, demand.contactEmail, demandId, actor);
  } else {
    await resolveBorrowerForClassification(demandId, demand.contactEmail, actor);
  }
  return (await getDemand(demandId))!;
}

export async function assign(demandId: number, targetUsername: string, actor: string): Promise<StepInstanceEntity> {
  const demand = await getDemand(demandId);
  if (!demand) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  if (demandStatus(demand) !== 'IN_PROGRESS') {
    throw conflict('Ce dossier est déjà à sa dernière étape et ne peut plus être avancé.');
  }
  const open = await findOpenStepInstance(demandId);
  if (!open) {
    throw notFound('Étape de circuit introuvable pour ce dossier.');
  }
  const current = (await stepInfoByWpsId(open.workflowProcessStepId))!;
  const target = await assertCanReassign(actor, targetUsername, current, open.assignedUsername);

  const previousUsername = open.assignedUsername;
  open.assignedUsername = target.username;
  open.assignedBy = actor;
  await saveStepInstance(open);

  const histId = await nextId('demandAssignments');
  const history: DemandAssignmentEntity = {
    id: histId,
    publicId: cryptoRandomId(),
    demandId,
    stepCode: current.stepCode,
    stepName: current.stepName,
    previousUsername,
    newUsername: target.username,
    assignedBy: actor,
    assignedAt: new Date().toISOString(),
  };
  await put('demandAssignments', history);
  await notifyAssignee(target.username, demand, current.stepName);
  return (await findOpenStepInstance(demandId))!;
}

async function assertCanReassign(assignerUsername: string, targetUsername: string, current: StepInfo, currentAssignee: string | null): Promise<UserEntity> {
  if (current.requiredGradeId == null || current.requiredTeamId == null) {
    if (currentAssignee != null && currentAssignee !== assignerUsername) {
      throw forbidden("Seul un membre de l'équipe requise par l'étape actuelle de ce dossier peut l'assigner.");
    }
    return requireStaff(targetUsername);
  }
  const assigner = await userByUsername(assignerUsername);
  const assignerIsSupervisor = await isSupervisorOf(assigner, current.requiredTeamId);
  const assignerInTeam = isMemberOf(assigner, current.requiredTeamId);
  if (!assignerIsSupervisor && !assignerInTeam) {
    throw forbidden("Seul un membre de l'équipe requise par l'étape actuelle de ce dossier peut l'assigner.");
  }
  const target = await userByUsername(targetUsername);
  const targetEligible = assignerIsSupervisor ? isMemberOf(target, current.requiredTeamId) : isEligibleFor(target, current);
  if (!targetEligible) {
    throw forbidden("Le profil grade/équipe de l'utilisateur cible ne correspond pas à celui requis par l'étape actuelle de ce dossier.");
  }
  return target;
}

export async function eligibleAssignees(demandId: number, direction: 'CURRENT' | 'NEXT' | 'PREVIOUS', actorUsername: string): Promise<UserEntity[]> {
  const demand = await getDemand(demandId);
  if (!demand) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  if (demandStatus(demand) !== 'IN_PROGRESS') {
    return [];
  }
  const open = await findOpenStepInstance(demandId);
  if (!open) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  const current = (await stepInfoByWpsId(open.workflowProcessStepId))!;
  let target: StepInfo | null;
  if (direction === 'CURRENT') {
    target = current;
  } else if (direction === 'NEXT') {
    target = await nextStep(demand.workflowId, current.globalOrder);
  } else {
    target = await previousStep(demand.workflowId, current.globalOrder);
  }
  if (!target) {
    return [];
  }
  const users = await getAll<UserEntity>('users');
  const managers = users.filter((u) => u.role === 'MANAGER');
  if (target.requiredGradeId == null || target.requiredTeamId == null) {
    return managers;
  }
  const actor = await userByUsername(actorUsername);
  if (await isSupervisorOf(actor, target.requiredTeamId)) {
    return managers.filter((u) => u.teamId === target!.requiredTeamId);
  }
  return managers.filter((u) => u.gradeId === target!.requiredGradeId && u.teamId === target!.requiredTeamId);
}

export { getDemand, demandStatus };
export type { DemandEntity, StepInstanceEntity };
