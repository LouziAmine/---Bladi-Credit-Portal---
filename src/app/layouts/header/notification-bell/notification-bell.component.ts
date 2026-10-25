import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationService } from '../../../core/services/notification-service/notification.service';
import { NotificationEntry } from '../../../core/models/notification.model';

const POLL_FALLBACK_MS = 5 * 60000;
const LATEST_COUNT = 10;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-bell',
  imports: [TranslatePipe, DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly isOpen = signal(false);
  protected readonly notifications = signal<NotificationEntry[]>([]);
  protected readonly unreadCount = signal(0);

  private eventSource: EventSource | undefined;
  private pollHandle: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    this.refreshUnreadCount();
    this.eventSource = this.notificationService.openStream();
    this.eventSource.addEventListener('notification', () => {
      this.refreshUnreadCount();
      if (this.isOpen()) {
        this.loadLatest();
      }
    });
    this.pollHandle = setInterval(() => this.refreshUnreadCount(), POLL_FALLBACK_MS);
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
    clearInterval(this.pollHandle);
  }

  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const opening = !this.isOpen();
    this.isOpen.set(opening);
    if (opening) {
      this.loadLatest();
    }
  }

  open(notification: NotificationEntry): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.notifications.update((items) =>
            items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
          this.unreadCount.update((count) => Math.max(0, count - 1));
        },
        error: () => undefined,
      });
    }
    this.isOpen.set(false);
    if (notification.link) {
      void this.router.navigateByUrl(notification.link);
    }
  }

  markAllRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
        this.unreadCount.set(0);
      },
      error: () => undefined,
    });
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  close(): void {
    this.isOpen.set(false);
  }

  private loadLatest(): void {
    this.notificationService.getMy(1, LATEST_COUNT).subscribe({
      next: (page) => this.notifications.set(page.items),
      error: () => undefined,
    });
  }

  private refreshUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => undefined,
    });
  }
}
