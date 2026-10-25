import { getAll, nextId, put } from '../core/demo-db';
import { clearSession, setSession } from '../core/demo-session';
import { DemoContext } from '../core/demo-context';
import { badRequest, conflict, created, DemoResult, noContent, ok, unauthorized, cryptoRandomId } from '../core/demo-result';
import { UserEntity } from '../core/entities';
import { AuthUserResponse, LoginRequest, RegisterRequest } from '../../core/models/auth.model';

function toAuthUser(u: UserEntity): AuthUserResponse {
  return { username: u.username, role: u.role };
}

async function findByUsername(username: string): Promise<UserEntity | undefined> {
  const users = await getAll<UserEntity>('users');
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

async function login(ctx: DemoContext): Promise<DemoResult> {
  const { username, password } = (ctx.body ?? {}) as LoginRequest;
  const user = await findByUsername(username ?? '');

  if (!user || user.password !== password) {
    throw unauthorized("Nom d'utilisateur ou mot de passe invalide.");
  }
  await setSession({ userId: user.id, username: user.username, role: user.role });
  return ok<AuthUserResponse>(toAuthUser(user));
}

const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

async function register(ctx: DemoContext): Promise<DemoResult> {
  const { username, password } = (ctx.body ?? {}) as RegisterRequest;
  if (!username || username.length < 3 || username.length > 100 || !USERNAME_REGEX.test(username)) {
    throw badRequest("Nom d'utilisateur invalide (3 à 100 caractères, lettres, chiffres, . _ -).");
  }
  if (!password || password.length < 12 || password.length > 100 || !PASSWORD_COMPLEXITY_REGEX.test(password)) {
    throw badRequest('Mot de passe invalide (12 à 100 caractères, au moins une minuscule, une majuscule et un chiffre).');
  }
  if (await findByUsername(username)) {
    throw conflict("Ce nom d'utilisateur est déjà utilisé.");
  }
  const id = await nextId('users');
  const user: UserEntity = {
    id,
    publicId: cryptoRandomId(),
    username,
    password,
    role: 'CLIENT',
    fullName: null,
    email: null,
    gradeId: null,
    teamId: null,
  };
  await put('users', user);
  return created(undefined);
}

async function refresh(ctx: DemoContext): Promise<DemoResult> {
  if (!ctx.session) {
    throw unauthorized('Jeton de rafraîchissement invalide.');
  }
  const user = await findByUsername(ctx.session.username);
  if (!user) {
    throw unauthorized('Jeton de rafraîchissement invalide.');
  }
  return ok<AuthUserResponse>(toAuthUser(user));
}

async function logout(): Promise<DemoResult> {
  await clearSession();
  return noContent();
}

async function me(ctx: DemoContext): Promise<DemoResult> {
  if (!ctx.session) {
    throw unauthorized('Authentification requise.');
  }
  const user = await findByUsername(ctx.session.username);
  if (!user) {
    throw unauthorized('Authentification requise.');
  }
  return ok<AuthUserResponse>(toAuthUser(user));
}

export const authRoutes = [
  { method: 'POST', pattern: '/auth/login', handler: login },
  { method: 'POST', pattern: '/auth/register', handler: register },
  { method: 'POST', pattern: '/auth/refresh', handler: refresh },
  { method: 'POST', pattern: '/auth/logout', handler: logout },
  { method: 'GET', pattern: '/auth/me', handler: me },
];
