import { DemoContext, requireManager } from '../core/demo-context';
import { DemoResult, ok } from '../core/demo-result';
import { EnterpriseType } from '../core/entities';
import { BamVerificationRequest, BamVerificationResponse } from '../../core/models/bam-verification.model';

const SOURCE = 'MOCK_SIMULATION';
const DISCLAIMER = 'Ceci est une donnée simulée à des fins de test MVP, ne pas utiliser pour une décision de crédit réelle.';
const FICTIONAL_BANKS = [
  'Atlas Al Maghrib Bank (fictional)',
  'Al Amane Credit Bank (fictional)',
  'Strait of Gibraltar Bank (fictional)',
  'Maghreb Finance Credit (fictional)',
  'Bank A',
  'Bank B',
];

type Scenario = 'CLEAR' | 'MINOR_INCIDENT' | 'ACTIVE_INCIDENT' | 'PERSONAL_EXPOSURE_DETECTED' | 'MULTIPLE_EXPOSURES' | 'CONSOLIDATED_GROUP_EXPOSURE' | 'REQUIRES_MANUAL_REVIEW';

const DISTRIBUTION: Record<EnterpriseType, [Scenario, number][]> = {
  TPE: [['CLEAR', 70], ['MINOR_INCIDENT', 20], ['ACTIVE_INCIDENT', 10]],
  AUTO_ENTREPRENEUR: [['CLEAR', 60], ['PERSONAL_EXPOSURE_DETECTED', 25], ['ACTIVE_INCIDENT', 15]],
  PME: [['CLEAR', 75], ['MULTIPLE_EXPOSURES', 15], ['ACTIVE_INCIDENT', 10]],
  ETI: [['CLEAR', 80], ['MULTIPLE_EXPOSURES', 15], ['ACTIVE_INCIDENT', 5]],
  GE: [['CLEAR', 85], ['CONSOLIDATED_GROUP_EXPOSURE', 10], ['REQUIRES_MANUAL_REVIEW', 5]],
};

function randInt(minInclusive: number, maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}
function drawScenario(type: EnterpriseType): Scenario {
  const weights = DISTRIBUTION[type];
  const roll = randInt(0, 99);
  let cumulative = 0;
  for (const [scenario, weight] of weights) {
    cumulative += weight;
    if (roll < cumulative) {
      return scenario;
    }
  }
  return weights[weights.length - 1][0];
}
function identifierType(type: EnterpriseType): string {
  return type === 'AUTO_ENTREPRENEUR' ? 'ICE+CIN' : 'ICE';
}
function randomRecentDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - randInt(30, 547));
  return d.toISOString().substring(0, 10);
}
function randomLoan(creditType: string) {
  return { institution: FICTIONAL_BANKS[randInt(0, FICTIONAL_BANKS.length - 1)], creditType, amount: randInt(100000, 5000000), repaymentStatus: 'CURRENT' as const };
}

async function verify(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const req = (ctx.body ?? {}) as BamVerificationRequest;
  const type = req.enterpriseType as EnterpriseType;
  const forced = ctx.query.get('scenario') as Scenario | null;
  const scenario: Scenario = forced ?? drawScenario(type);
  const base = {
    source: SOURCE,
    disclaimer: DISCLAIMER,
    verifiedIdentifier: req.identifier,
    identifierType: identifierType(type),
    timestamp: new Date().toISOString(),
  };

  let res: BamVerificationResponse;
  switch (scenario) {
    case 'MINOR_INCIDENT':
    case 'ACTIVE_INCIDENT':
      res = {
        ...base,
        scipResult: { status: 'INCIDENT_DETECTED', incidents: [{ type: 'unpaid_cheque', date: randomRecentDate(), amount: randInt(2000, 50000), resolved: scenario === 'MINOR_INCIDENT' }] },
        centraleRisquesResult: { status: 'CLEAR', outstandingLoans: [] },
        simulatedRecommendation: scenario === 'MINOR_INCIDENT' ? 'FAVORABLE' : 'UNFAVORABLE',
      };
      break;
    case 'PERSONAL_EXPOSURE_DETECTED':
      res = { ...base, scipResult: { status: 'CLEAR', incidents: [] }, centraleRisquesResult: { status: 'EXPOSURE_DETECTED', outstandingLoans: [randomLoan('Personal credit')] }, simulatedRecommendation: 'TO_REVIEW' };
      break;
    case 'MULTIPLE_EXPOSURES':
      res = { ...base, scipResult: { status: 'CLEAR', incidents: [] }, centraleRisquesResult: { status: 'EXPOSURE_DETECTED', outstandingLoans: [randomLoan('Investment credit'), randomLoan('Cash-flow credit')] }, simulatedRecommendation: 'TO_REVIEW' };
      break;
    case 'CONSOLIDATED_GROUP_EXPOSURE':
      res = { ...base, scipResult: { status: 'CLEAR', incidents: [] }, centraleRisquesResult: { status: 'EXPOSURE_DETECTED', outstandingLoans: [randomLoan('Investment credit (subsidiary 1)'), randomLoan('Cash-flow line (subsidiary 2)'), randomLoan('Leasing (parent company)')] }, simulatedRecommendation: 'TO_REVIEW' };
      break;
    case 'REQUIRES_MANUAL_REVIEW':
      res = { ...base, scipResult: { status: 'CLEAR', incidents: [] }, centraleRisquesResult: { status: 'CLEAR', outstandingLoans: [] }, simulatedRecommendation: 'TO_REVIEW' };
      break;
    case 'CLEAR':
    default:
      res = { ...base, scipResult: { status: 'CLEAR', incidents: [] }, centraleRisquesResult: { status: 'CLEAR', outstandingLoans: [] }, simulatedRecommendation: 'FAVORABLE' };
  }
  return ok(res);
}

export const bamVerificationRoutes = [{ method: 'POST', pattern: '/mock/verification-bam', handler: verify }];
