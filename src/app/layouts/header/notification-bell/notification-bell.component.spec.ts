import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../../core/services/notification-service/notification.service';
import { NotificationEntry } from '../../../core/models/notification.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { CODE_DEMAND_ASSIGNED } from '../../../testing/mocks/mock-codes';
import { DATE_2026_10_11T10_00_00Z } from '../../../testing/mocks/mock-dates';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let notificationService: NotificationService;
  let streamListeners: Record<string, () => void>;
  let closeStream: ReturnType<typeof vi.fn>;

  const unread: NotificationEntry = {
    id: 'n-1', type: CODE_DEMAND_ASSIGNED, title: 'Dossier assigné', body: 'DEM-1 vous a été assigné',
    link: '/admin/demands/d-1', read: false, createdAt: DATE_2026_10_11T10_00_00Z,
  };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const bellButton = (): HTMLButtonElement => element().querySelector('button[aria-expanded]') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    notificationService = TestBed.inject(NotificationService);
    streamListeners = {};
    closeStream = vi.fn();
    vi.spyOn(notificationService, 'openStream').mockReturnValue({
      addEventListener: (type: string, listener: () => void) => { streamListeners[type] = listener; },
      close: closeStream,
    } as unknown as EventSource);
    vi.spyOn(notificationService, 'getUnreadCount').mockReturnValue(of(3));
    vi.spyOn(notificationService, 'getMy').mockReturnValue(
      of({ items: [unread], total: 1, lastPage: 1, currentPage: 1, size: 10 }));

    fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
  });

  it('shows the unread count as soon as it appears', () => {
    expect(element().querySelector('.badge')?.textContent?.trim()).toBe('3');
  });

  it('refreshes the unread count when the server pushes a notification', () => {
    vi.mocked(notificationService.getUnreadCount).mockReturnValue(of(12));

    streamListeners['notification']();
    fixture.detectChanges();

    expect(element().querySelector('.badge')?.textContent?.trim()).toBe('9+');
  });

  it('loads the latest notifications when opened', () => {
    bellButton().click();
    fixture.detectChanges();

    expect(notificationService.getMy).toHaveBeenCalledWith(1, 10);
    expect(element().textContent).toContain('Dossier assigné');
    expect(bellButton().getAttribute('aria-expanded')).toBe('true');
  });

  it('marks a notification read and follows its link when clicked', () => {
    const markAsRead = vi.spyOn(notificationService, 'markAsRead').mockReturnValue(of(void 0));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    bellButton().click();
    fixture.detectChanges();

    (element().querySelector('.cb-notification-list button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(markAsRead).toHaveBeenCalledWith('n-1');
    expect(navigate).toHaveBeenCalledWith('/admin/demands/d-1');
    expect(element().querySelector('.badge')?.textContent?.trim()).toBe('2');
  });

  it('marks everything read at once', () => {
    vi.spyOn(notificationService, 'markAllAsRead').mockReturnValue(of(void 0));
    bellButton().click();
    fixture.detectChanges();

    (element().querySelector('.btn-link') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element().querySelector('.badge')).toBeNull();
  });

  it('closes on a click elsewhere or on Escape', () => {
    bellButton().click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(bellButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the live stream when it goes away', () => {
    fixture.destroy();

    expect(closeStream).toHaveBeenCalled();
  });
});
