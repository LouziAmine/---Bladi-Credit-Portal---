import { getAll } from '../core/demo-db';
import { DemoContext, requireManager } from '../core/demo-context';
import { ok, DemoResult } from '../core/demo-result';
import { GradeEntity, TeamEntity } from '../core/entities';
import { GradeResponse, TeamResponse } from '../../core/models/reference-data.model';

async function listGrades(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const grades = await getAll<GradeEntity>('grades');
  grades.sort((a, b) => a.id - b.id);
  return ok<GradeResponse[]>(grades.map((g) => ({ id: g.publicId, code: g.code, name: g.name })));
}

async function listTeams(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const teams = await getAll<TeamEntity>('teams');
  teams.sort((a, b) => a.id - b.id);
  return ok<TeamResponse[]>(teams.map((t) => ({ id: t.publicId, code: t.code, name: t.name })));
}

export const referenceDataRoutes = [
  { method: 'GET', pattern: '/grades', handler: listGrades },
  { method: 'GET', pattern: '/teams', handler: listTeams },
];
