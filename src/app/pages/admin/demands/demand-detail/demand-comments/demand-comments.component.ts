import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DemandCommentResponse } from '../../../../../core/models/demand.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-comments',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './demand-comments.component.html',
})
export class DemandCommentsComponent {
  readonly comments = input.required<DemandCommentResponse[]>();
}
