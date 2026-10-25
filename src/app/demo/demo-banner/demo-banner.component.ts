import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth-service/auth.service';

interface InboxItem {
  token: string;
  email: string;
  label: string;
}

interface AccountMember {
  username: string;
  fullName: string;
  team: string;
}

interface AccountGroup {
  grade: string;
  members: AccountMember[];
}

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: [
    `
      .demo-bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1080;
        background: #1f2937;
        color: #f9fafb;
        font-size: 0.85rem;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.25);
      }
      .demo-bar a {
        color: #93c5fd;
      }
      .demo-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.4rem 1rem;
        flex-wrap: wrap;
      }
      .demo-badge {
        background: #f59e0b;
        color: #111827;
        font-weight: 700;
        border-radius: 0.25rem;
        padding: 0.05rem 0.45rem;
      }
      .demo-panel {
        border-top: 1px solid #374151;
        padding: 0.6rem 1rem;
        max-height: 48vh;
        overflow: auto;
      }
      .demo-spacer {
        height: 2.4rem;
      }
      .demo-section-title {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin: 0.6rem 0 0.35rem;
        font-weight: 700;
      }
      .demo-section-title .hint {
        font-weight: 400;
        font-size: 0.75rem;
        color: #9ca3af;
      }
      code {
        color: #fcd34d;
      }
      .acct-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
        gap: 0.5rem;
      }
      .acct-card {
        background: #111827;
        border: 1px solid #374151;
        border-radius: 0.6rem;
        padding: 0.45rem 0.55rem;
      }
      .acct-card__grade {
        font-weight: 700;
        font-size: 0.78rem;
        color: #f9fafb;
        margin-bottom: 0.3rem;
        letter-spacing: 0.01em;
      }
      .acct-card__grade .count {
        color: #9ca3af;
        font-weight: 400;
      }
      .acct-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.3rem 0;
        border-top: 1px solid #1f2937;
      }
      .acct-row:first-of-type {
        border-top: 0;
      }
      .acct-info {
        min-width: 0;
      }
      .acct-user {
        font-family: monospace;
        color: #fcd34d;
        font-size: 0.83rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .acct-meta {
        color: #9ca3af;
        font-size: 0.72rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .acct-you {
        background: #10b981;
        color: #06281d;
        font-weight: 700;
        border-radius: 0.25rem;
        padding: 0 0.35rem;
        font-size: 0.66rem;
      }
      .acct-login {
        white-space: nowrap;
        flex: 0 0 auto;
      }
    `,
  ],
  template: `
    @if (isDemo) {
      <div class="demo-spacer"></div>
      <div class="demo-bar">
        <div class="demo-head">
          <span class="demo-badge">DÉMO</span>
          <span>Données stockées dans votre navigateur (aucun serveur).</span>
          <button type="button" class="btn btn-sm btn-outline-light py-0" (click)="toggle()">
            {{ open() ? 'Masquer' : 'Détails' }}
          </button>
          <button type="button" class="btn btn-sm btn-warning py-0" (click)="reset()" [disabled]="resetting()">
            {{ resetting() ? 'Réinitialisation…' : 'Réinitialiser la démo' }}
          </button>
        </div>
        @if (open()) {
          <div class="demo-panel">
            <p class="mb-1">
              Mot de passe de tous les managers : <code>demo123</code> (sauf <code>admin</code> : <code>admin123</code>).
              Les clients se créent via une invitation ci-dessous ou un rattachement.
            </p>

            <div class="demo-section-title">
              <span>Comptes managers</span>
              <span class="hint">Cliquez « Se connecter » pour suivre un dossier d'un responsable à l'autre.</span>
            </div>
            @if (accounts().length > 0) {
              <div class="acct-grid">
                @for (group of accounts(); track group.grade) {
                  <div class="acct-card">
                    <div class="acct-card__grade">
                      {{ group.grade }} <span class="count">· {{ group.members.length }}</span>
                    </div>
                    @for (m of group.members; track m.username) {
                      <div class="acct-row">
                        <div class="acct-info">
                          <div class="acct-user">
                            <span>{{ m.username }}</span>
                            @if (m.username === currentUser()) {
                              <span class="acct-you">connecté</span>
                            }
                          </div>
                          <div class="acct-meta">{{ m.fullName }} · {{ m.team }}</div>
                        </div>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-info py-0 acct-login"
                          [disabled]="loggingIn() || m.username === currentUser()"
                          (click)="loginAs(m.username)"
                        >
                          {{ m.username === currentUser() ? 'Actif' : 'Se connecter' }}
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <div class="demo-section-title">
              <span>Boîte de réception des invitations</span>
              <button type="button" class="btn btn-sm btn-outline-light py-0" (click)="refreshInbox()">Rafraîchir</button>
            </div>
            @if (inbox().length === 0) {
              <p class="mb-0 text-secondary">Aucune invitation en attente. Classez un dossier « REAL » avec un e-mail inconnu pour en générer une.</p>
            } @else {
              <ul class="mb-0 ps-3">
                @for (item of inbox(); track item.token) {
                  <li class="mb-1">
                    {{ item.email }} — {{ item.label }}
                    <a [routerLink]="['/invitations', item.token]">Ouvrir le lien d'invitation</a>
                  </li>
                }
              </ul>
            }
          </div>
        }
      </div>
    }
  `,
})
export class DemoBannerComponent {
  private readonly auth = inject(AuthService);
  readonly isDemo = environment.demo;
  readonly open = signal(false);
  readonly resetting = signal(false);
  readonly loggingIn = signal(false);
  readonly inbox = signal<InboxItem[]>([]);
  readonly accounts = signal<AccountGroup[]>([]);
  readonly currentUser = signal<string | null>(null);

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.currentUser.set(this.auth.getCurrentUsername());
      void this.refreshInbox();
      void this.loadAccounts();
    }
  }

  async loadAccounts(): Promise<void> {
    if (!this.isDemo || this.accounts().length > 0) {
      return;
    }
    const { getAll } = await import('../core/demo-db');
    const [users, grades, teams] = await Promise.all([
      getAll<{ username: string; fullName: string; role: string; gradeId: number | null; teamId: number | null }>('users'),
      getAll<{ id: number; name: string }>('grades'),
      getAll<{ id: number; name: string }>('teams'),
    ]);
    const gradeName = (id: number | null): string => (id != null ? grades.find((g) => g.id === id)?.name ?? 'Autre' : 'Autre');
    const teamName = (id: number | null): string => (id != null ? teams.find((t) => t.id === id)?.name ?? '—' : '—');
    const groups = new Map<string, AccountMember[]>();
    for (const u of users) {
      if (u.role !== 'MANAGER' || u.username === 'admin' || u.gradeId == null) {
        continue;
      }
      const key = gradeName(u.gradeId);
      const member: AccountMember = { username: u.username, fullName: u.fullName, team: teamName(u.teamId) };
      const list = groups.get(key);
      if (list) {
        list.push(member);
      } else {
        groups.set(key, [member]);
      }
    }
    const result = [...groups.entries()]
      .map(([grade, members]) => ({ grade, members: members.sort((a, b) => a.username.localeCompare(b.username)) }))
      .sort((a, b) => a.grade.localeCompare(b.grade));
    const admin = users.find((u) => u.username === 'admin');
    if (admin) {
      result.unshift({ grade: 'Administration', members: [{ username: 'admin', fullName: admin.fullName, team: '—' }] });
    }
    this.accounts.set(result);
  }

  loginAs(username: string): void {
    if (this.loggingIn()) {
      return;
    }
    this.loggingIn.set(true);
    const password = username === 'admin' ? 'admin123' : 'demo123';
    this.auth.login({ username, password }).subscribe({
      next: () => {
        window.location.assign(new URL('admin/demands', document.baseURI).href);
      },
      error: () => {
        this.loggingIn.set(false);
      },
    });
  }

  async refreshInbox(): Promise<void> {
    if (!this.isDemo) {
      return;
    }
    const [{ getAll }] = await Promise.all([import('../core/demo-db')]);
    const [invitations, enterprises, demands] = await Promise.all([
      getAll<{ token: string; email: string; status: string; enterpriseId: number | null; demandId: number | null }>('invitations'),
      getAll<{ id: number; name: string }>('enterprises'),
      getAll<{ id: number; reference: string }>('demands'),
    ]);
    const items = invitations
      .filter((i) => i.status === 'PENDING')
      .map((i) => {
        let label = 'invitation';
        if (i.enterpriseId != null) {
          label = 'entreprise ' + (enterprises.find((e) => e.id === i.enterpriseId)?.name ?? '');
        } else if (i.demandId != null) {
          label = 'dossier ' + (demands.find((d) => d.id === i.demandId)?.reference ?? '');
        }
        return { token: i.token, email: i.email, label };
      });
    this.inbox.set(items);
  }

  async reset(): Promise<void> {
    if (!this.isDemo || this.resetting()) {
      return;
    }
    this.resetting.set(true);
    try {
      const { resetDemo } = await import('../seed/seed');
      await resetDemo();
    } finally {
      location.reload();
    }
  }
}
