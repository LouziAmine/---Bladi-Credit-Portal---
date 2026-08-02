import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth-service/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isMenuOpen      = signal(false);
  protected readonly isAdminMenuOpen = signal(false);
  protected readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  protected readonly isManager       = computed(() => this.authService.isManager());
  protected readonly username        = computed(() => this.authService.getCurrentUsername());
  protected readonly role            = computed(() => this.authService.getCurrentUserRole());

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  toggleAdminMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isAdminMenuOpen.update((v) => !v);
  }

  @HostListener('document:click')
  closeAdminMenu(): void {
    this.isAdminMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeAdminMenuOnEscape(): void {
    this.isAdminMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }
}