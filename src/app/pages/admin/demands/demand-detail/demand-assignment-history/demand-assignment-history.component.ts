import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DemandAssignmentHistoryEntryResponse } from '../../../../../core/models/demand.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-assignment-history',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './demand-assignment-history.component.html',
})
export class DemandAssignmentHistoryComponent {
  readonly assignmentHistory = input.required<DemandAssignmentHistoryEntryResponse[]>();
}
