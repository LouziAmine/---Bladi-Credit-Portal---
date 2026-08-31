import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { MourabahaParametersComponent } from './mourabaha-parameters.component';
import { MourabahaParametersService } from '../../../core/services/mourabaha-parameters-service/mourabaha-parameters.service';
import { MourabahaParametersResponse } from '../../../core/models/mourabaha-parameters.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_0, AMOUNT_6, DECIMAL_0_0004, DECIMAL_0_1, DECIMAL_5_5 } from '../../../testing/mocks/mock-amounts';

describe('MourabahaParametersComponent', () => {
  let fixture: ComponentFixture<MourabahaParametersComponent>;
  let component: MourabahaParametersComponent;
  let service: MourabahaParametersService;

  const record: MourabahaParametersResponse = {
    id: 'm-1', profitRate: DECIMAL_5_5, vatRate: DECIMAL_0_1, takafulMonthlyRate: DECIMAL_0_0004, active: true,
  };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MourabahaParametersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MourabahaParametersComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MourabahaParametersService);
    vi.spyOn(service, 'getAll').mockReturnValue(
      of({ items: [record], total: 1, lastPage: 1, currentPage: 1, size: 20 }));
    fixture.detectChanges();
  });

  it('lists the configurations with their status', () => {
    expect(element().querySelector('table')?.textContent).toContain('5.5');
    expect(element().querySelector('.cb-badge--green')).not.toBeNull();
  });

  it('opens the editor with the selected configuration', () => {
    component.selectRecord(record);
    fixture.detectChanges();

    expect((element().querySelector('#profitRate') as HTMLInputElement).value).toBe('5.5');
  });

  it('sends only the edited values and reloads the list', () => {
    const patch = vi.spyOn(service, 'patch').mockReturnValue(of(undefined));
    component.selectRecord(record);
    component['form'].patchValue({ profitRate: AMOUNT_6 });

    component.submit();

    expect(patch).toHaveBeenCalledWith('m-1', {
      profitRate: AMOUNT_6, vatRate: DECIMAL_0_1, takafulMonthlyRate: DECIMAL_0_0004, active: true,
    });
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('refuses a rate that is not strictly positive', () => {
    const patch = vi.spyOn(service, 'patch');
    component.selectRecord(record);
    component['form'].patchValue({ profitRate: AMOUNT_0 });

    component.submit();

    expect(patch).not.toHaveBeenCalled();
  });
});
