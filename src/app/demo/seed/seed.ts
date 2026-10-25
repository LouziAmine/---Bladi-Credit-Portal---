import { bulkPut, clearAllStores, ensureSequenceAtLeast, getMeta, setMeta } from '../core/demo-db';
import { SEED_GRADES, SEED_TEAMS } from './seed-reference';
import { SEED_USERS } from './seed-users';
import {
  SEED_BAM_PARAMETERS,
  SEED_CREDIT_RATES,
  SEED_INVESTMENT_PARAMETERS,
  SEED_MOURABAHA_PARAMETERS,
} from './seed-parameters';
import { SEED_ACTIVITY_SECTORS, SEED_DOCUMENT_SUGGESTIONS } from './seed-catalog';
import {
  SEED_PROCESSES,
  SEED_STEPS,
  SEED_WORKFLOWS,
  SEED_WORKFLOW_PROCESSES,
  SEED_WORKFLOW_PROCESS_STEPS,
} from './seed-workflow';

export const SEED_VERSION = 4;

const SEED_FLAG = 'seedVersion';

export async function ensureSeeded(): Promise<void> {
  const current = await getMeta<number>(SEED_FLAG);
  if (current === SEED_VERSION) {
    return;
  }
  if (current !== undefined) {

    await clearAllStores();
  }

  await bulkPut('grades', SEED_GRADES);
  await bulkPut('teams', SEED_TEAMS);
  await bulkPut('users', SEED_USERS);
  await bulkPut('creditRates', SEED_CREDIT_RATES);
  await bulkPut('bamParameters', SEED_BAM_PARAMETERS);
  await bulkPut('mourabahaParameters', SEED_MOURABAHA_PARAMETERS);
  await bulkPut('investmentCreditParameters', SEED_INVESTMENT_PARAMETERS);
  await bulkPut('activitySectors', SEED_ACTIVITY_SECTORS);
  await bulkPut('documentSuggestions', SEED_DOCUMENT_SUGGESTIONS);
  await bulkPut('processes', SEED_PROCESSES);
  await bulkPut('steps', SEED_STEPS);
  await bulkPut('workflows', SEED_WORKFLOWS);
  await bulkPut('workflowProcesses', SEED_WORKFLOW_PROCESSES);
  await bulkPut('workflowProcessSteps', SEED_WORKFLOW_PROCESS_STEPS);

  await ensureSequenceAtLeast('users', Math.max(...SEED_USERS.map((u) => u.id)));
  await ensureSequenceAtLeast('activitySectors', Math.max(...SEED_ACTIVITY_SECTORS.map((s) => s.id)));
  await ensureSequenceAtLeast('documentSuggestions', Math.max(...SEED_DOCUMENT_SUGGESTIONS.map((s) => s.id)));

  await setMeta(SEED_FLAG, SEED_VERSION);
}

export async function resetDemo(): Promise<void> {
  await clearAllStores();
  await ensureSeeded();
}
