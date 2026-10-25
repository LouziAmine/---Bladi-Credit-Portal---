import { getAll, get, nextId, put } from '../core/demo-db';
import { cryptoRandomId } from '../core/demo-result';
import { GradeEntity, TeamEntity } from '../core/entities';
import {
  DemandEntity,
  ProcessEntity,
  StepEntity,
  StepInfo,
  StepInstanceEntity,
  WorkflowProcessEntity,
  WorkflowProcessStepEntity,
} from '../core/workflow-entities';

interface Catalog {
  processes: ProcessEntity[];
  steps: StepEntity[];
  wps: WorkflowProcessStepEntity[];
  wp: WorkflowProcessEntity[];
  grades: GradeEntity[];
  teams: TeamEntity[];
}

async function loadCatalog(): Promise<Catalog> {
  const [processes, steps, wps, wp, grades, teams] = await Promise.all([
    getAll<ProcessEntity>('processes'),
    getAll<StepEntity>('steps'),
    getAll<WorkflowProcessStepEntity>('workflowProcessSteps'),
    getAll<WorkflowProcessEntity>('workflowProcesses'),
    getAll<GradeEntity>('grades'),
    getAll<TeamEntity>('teams'),
  ]);
  return { processes, steps, wps, wp, grades, teams };
}

function buildStepInfo(wps: WorkflowProcessStepEntity, cat: Catalog): StepInfo | null {
  const wp = cat.wp.find((x) => x.id === wps.workflowProcessId);
  if (!wp) {
    return null;
  }
  const process = cat.processes.find((p) => p.id === wp.processId);
  const step = cat.steps.find((s) => s.id === wps.stepId);
  if (!process || !step) {
    return null;
  }
  const grade = step.requiredGradeId != null ? cat.grades.find((g) => g.id === step.requiredGradeId) : undefined;
  const team = wps.requiredTeamId != null ? cat.teams.find((t) => t.id === wps.requiredTeamId) : undefined;
  return {
    workflowProcessStepId: wps.id,
    workflowId: wp.workflowId,
    processCode: process.code,
    processName: process.name,
    stepCode: step.code,
    stepName: step.name,
    typicalRole: step.typicalRole,
    globalOrder: wp.sequenceOrder * 1000 + wps.sequenceOrder,
    requiredGradeId: step.requiredGradeId,
    requiredGradeCode: grade?.code ?? null,
    requiredGradeName: grade?.name ?? null,
    requiredTeamId: wps.requiredTeamId,
    requiredTeamCode: team?.code ?? null,
    requiredTeamName: team?.name ?? null,
    requiresClassification: step.requiresClassification,
    requiresInsuranceConfirmation: step.requiresInsuranceConfirmation,
    requiresFourEyes: step.requiresFourEyes,
    notifyContactOnEnterType: step.notifyContactOnEnterType,
  };
}

export async function allStepsForWorkflow(workflowId: number): Promise<StepInfo[]> {
  const cat = await loadCatalog();
  const wpIds = new Set(cat.wp.filter((x) => x.workflowId === workflowId).map((x) => x.id));
  return cat.wps
    .filter((wps) => wpIds.has(wps.workflowProcessId))
    .map((wps) => buildStepInfo(wps, cat))
    .filter((s): s is StepInfo => s !== null)
    .sort((a, b) => a.globalOrder - b.globalOrder);
}

export async function firstStep(workflowId: number): Promise<StepInfo | null> {
  const steps = await allStepsForWorkflow(workflowId);
  return steps[0] ?? null;
}

export async function nextStep(workflowId: number, afterGlobalOrder: number): Promise<StepInfo | null> {
  const steps = await allStepsForWorkflow(workflowId);
  return steps.find((s) => s.globalOrder > afterGlobalOrder) ?? null;
}

export async function previousStep(workflowId: number, beforeGlobalOrder: number): Promise<StepInfo | null> {
  const steps = await allStepsForWorkflow(workflowId);
  const earlier = steps.filter((s) => s.globalOrder < beforeGlobalOrder);
  return earlier.length ? earlier[earlier.length - 1] : null;
}

export async function stepInfoByWpsId(wpsId: number): Promise<StepInfo | null> {
  const cat = await loadCatalog();
  const wps = cat.wps.find((x) => x.id === wpsId);
  return wps ? buildStepInfo(wps, cat) : null;
}

export async function findOpenStepInstance(demandId: number): Promise<StepInstanceEntity | undefined> {
  const all = await getAll<StepInstanceEntity>('demandStepInstances');
  return all.find((s) => s.demandId === demandId && s.exitedAt === null);
}

export async function findStepInstances(demandId: number): Promise<StepInstanceEntity[]> {
  const all = await getAll<StepInstanceEntity>('demandStepInstances');
  return all
    .filter((s) => s.demandId === demandId)
    .sort((a, b) => (a.enteredAt === b.enteredAt ? a.id - b.id : a.enteredAt < b.enteredAt ? -1 : 1));
}

export async function openStepInstance(
  demandId: number,
  workflowProcessStepId: number,
  assignee: string | null,
  assignedBy: string | null,
  now: string,
): Promise<StepInstanceEntity> {
  const id = await nextId('demandStepInstances');
  const instance: StepInstanceEntity = {
    id,
    publicId: cryptoRandomId(),
    demandId,
    workflowProcessStepId,
    assignedUsername: assignee,
    assignedBy,
    enteredAt: now,
    exitedAt: null,
    decisionNote: null,
    decisionOutcome: null,
    returnReasonCode: null,
    recommendations: null,
    reserves: null,
    committeeType: null,
    rateOption: null,
    previousRate: null,
    appliedRate: null,
    rateChangedBy: null,
    closedBy: null,
    amountOption: null,
    previousAmount: null,
    appliedAmount: null,
    durationOption: null,
    previousDuration: null,
    appliedDuration: null,
    classificationOutcome: null,
    insuranceAdiSubscribed: null,
    insuranceCoverageType: null,
    insuranceDamageSubscribed: null,
  };
  await put('demandStepInstances', instance);
  return instance;
}

export async function saveStepInstance(instance: StepInstanceEntity): Promise<void> {
  await put('demandStepInstances', instance);
}

export async function hasClosedAnyStep(demandId: number, username: string): Promise<boolean> {
  const all = await getAll<StepInstanceEntity>('demandStepInstances');
  return all.some((s) => s.demandId === demandId && s.closedBy === username);
}

export function generateReference(): string {
  return 'DEM-' + cryptoRandomId().replace(/-/g, '').substring(0, 12).toUpperCase();
}

export async function getDemand(demandId: number): Promise<DemandEntity | undefined> {
  return get<DemandEntity>('demands', demandId);
}

export async function saveDemand(demand: DemandEntity): Promise<void> {
  await put('demands', demand);
}

export function demandStatus(demand: DemandEntity): 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' {
  if (demand.rejectedAt) {
    return 'REJECTED';
  }
  if (demand.completedAt) {
    return 'COMPLETED';
  }
  return 'IN_PROGRESS';
}
