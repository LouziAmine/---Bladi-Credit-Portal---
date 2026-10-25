import { ChangeDetectionStrategy, Component, computed, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth-service/auth.service';
import { APP_LANGUAGES, AppLanguage, LanguageService } from '../../core/services/language-service/language.service';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  protected readonly languages         = APP_LANGUAGES;
  protected readonly isMenuOpen        = signal(false);
  protected readonly isAdminMenuOpen   = signal(false);
  protected readonly isLanguageMenuOpen = signal(false);
  protected readonly openAdminGroup    = signal<string | null>(null);
  protected readonly isAuthenticated   = computed(() => this.authService.isAuthenticated());
  protected readonly isManager         = computed(() => this.authService.isManager());
  protected readonly isClient          = computed(() => this.authService.isClient());
  protected readonly username          = computed(() => this.authService.getCurrentUsername());
  protected readonly role              = computed(() => this.authService.getCurrentUserRole());
  protected readonly currentLanguage   = computed(() => this.languageService.currentLanguage());

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        this.isMenuOpen.set(false);
        this.isAdminMenuOpen.set(false);
      });
  }

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  toggleAdminMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isAdminMenuOpen.update((v) => !v);
    this.openAdminGroup.set(null);
  }

  toggleAdminGroup(event: Event, group: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.openAdminGroup.update((current) => (current === group ? null : group));
  }

  toggleLanguageMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isLanguageMenuOpen.update((v) => !v);
  }

  selectLanguage(lang: AppLanguage): void {
    this.languageService.setLanguage(lang);
    this.isLanguageMenuOpen.set(false);
  }

  @HostListener('document:click')
  closeAdminMenu(): void {
    this.isAdminMenuOpen.set(false);
    this.openAdminGroup.set(null);
    this.isLanguageMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeAdminMenuOnEscape(): void {
    this.isAdminMenuOpen.set(false);
    this.openAdminGroup.set(null);
    this.isLanguageMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }
}
