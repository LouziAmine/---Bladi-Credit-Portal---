import { getAll, nextId, put } from '../core/demo-db';
import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { badRequest, conflict, created, cryptoRandomId, DemoResult, forbidden, noContent, notFound, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { GradeEntity, TeamEntity, UserEntity } from '../core/entities';
import { CreateUserRequest, UpdateUserProfileRequest, UpdateUserRoleRequest, UserResponse, UserRole } from '../../core/models/user.model';

export async function toUserResponse(u: UserEntity): Promise<UserResponse> {
  const grades = await getAll<GradeEntity>('grades');
  const teams = await getAll<TeamEntity>('teams');
  const grade = u.gradeId != null ? grades.find((g) => g.id === u.gradeId) : undefined;
  const team = u.teamId != null ? teams.find((t) => t.id === u.teamId) : undefined;
  return {
    id: u.publicId,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    gradeCode: grade?.code ?? null,
    gradeName: grade?.name ?? null,
    teamCode: team?.code ?? null,
    teamName: team?.name ?? null,
  };
}

async function resolveUser(publicId: string): Promise<UserEntity> {
  const users = await getAll<UserEntity>('users');
  const found = users.find((u) => u.publicId === publicId);
  if (!found) {
    throw notFound('Utilisateur introuvable.');
  }
  return found;
}

async function gradeIdFromCode(code: string | null | undefined): Promise<number | null> {
  if (code == null) {
    return null;
  }
  const grades = await getAll<GradeEntity>('grades');
  const g = grades.find((x) => x.code === code);
  if (!g) {
    throw badRequest(`Valeur invalide : gradeCode: ${code}`);
  }
  return g.id;
}

async function teamIdFromCode(code: string | null | undefined): Promise<number | null> {
  if (code == null) {
    return null;
  }
  const teams = await getAll<TeamEntity>('teams');
  const t = teams.find((x) => x.code === code);
  if (!t) {
    throw badRequest(`Valeur invalide : teamCode: ${code}`);
  }
  return t.id;
}

async function listUsers(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const users = (await getAll<UserEntity>('users')).sort((a, b) => a.id - b.id);
  const mapped = await Promise.all(users.map(toUserResponse));
  return ok(paginate(mapped, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function createUser(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const dto = (ctx.body ?? {}) as CreateUserRequest;
  const users = await getAll<UserEntity>('users');
  if (users.some((u) => u.username.toLowerCase() === (dto.username ?? '').toLowerCase())) {
    throw conflict("Ce nom d'utilisateur est déjà utilisé.");
  }
  const gradeId = await gradeIdFromCode(dto.gradeCode);
  const teamId = await teamIdFromCode(dto.teamCode);
  const id = await nextId('users');
  const user: UserEntity = {
    id,
    publicId: cryptoRandomId(),
    username: dto.username,
    password: dto.password,
    role: dto.role,
    fullName: dto.fullName ?? null,
    email: dto.email ?? null,
    gradeId,
    teamId,
  };
  await put('users', user);
  return created(undefined);
}

async function getUser(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  return ok(await toUserResponse(await resolveUser(ctx.params['id'])));
}

async function updateRole(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const target = await resolveUser(ctx.params['id']);
  const role = ((ctx.body ?? {}) as UpdateUserRoleRequest).role as UserRole;
  if (target.username === actor.username) {
    throw forbidden('Un manager ne peut pas modifier son propre rôle.');
  }
  if (target.role === 'MANAGER' && role !== 'MANAGER') {
    const users = await getAll<UserEntity>('users');
    const managerCount = users.filter((u) => u.role === 'MANAGER').length;
    if (managerCount <= 1) {
      throw forbidden(
        'Impossible de modifier le rôle du dernier manager restant. Promouvez d’abord un autre utilisateur au rôle de manager.',
      );
    }
  }
  target.role = role;
  await put('users', target);
  return noContent();
}

async function updateProfile(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const target = await resolveUser(ctx.params['id']);
  if (target.username === actor.username) {
    throw forbidden('Un manager ne peut pas modifier son propre grade ni sa propre équipe.');
  }
  const dto = (ctx.body ?? {}) as UpdateUserProfileRequest;
  target.gradeId = await gradeIdFromCode(dto.gradeCode);
  target.teamId = await teamIdFromCode(dto.teamCode);
  if (dto.email !== undefined) {
    target.email = dto.email;
  }
  await put('users', target);
  return noContent();
}

export const usersRoutes = [
  { method: 'GET', pattern: '/users', handler: listUsers },
  { method: 'POST', pattern: '/users', handler: createUser },
  { method: 'GET', pattern: '/users/:id', handler: getUser },
  { method: 'PATCH', pattern: '/users/:id/role', handler: updateRole },
  { method: 'PATCH', pattern: '/users/:id/profile', handler: updateProfile },
];
