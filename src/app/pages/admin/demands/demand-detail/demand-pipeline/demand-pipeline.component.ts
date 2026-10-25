import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DemandPipelineStepResponse, PipelineStepStatus } from '../../../../../core/models/demand.model';

interface PipelineStepView extends DemandPipelineStepResponse {
  stepNumber: number;
}

interface PipelinePhaseView {
  processCode: string;
  processName: string;
  phaseNumber: number;
  status: PipelineStepStatus;
  steps: PipelineStepView[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-pipeline',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './demand-pipeline.component.html',
  styleUrl: './demand-pipeline.component.css',
})
export class DemandPipelineComponent {
  readonly steps = input<DemandPipelineStepResponse[]>([]);

  protected readonly phases = computed<PipelinePhaseView[]>(() => {
    const phases: PipelinePhaseView[] = [];
    let stepNumber = 0;

    for (const step of this.steps()) {
      stepNumber += 1;
      const stepView: PipelineStepView = { ...step, stepNumber };

      const lastPhase = phases[phases.length - 1];
      if (lastPhase && lastPhase.processCode === step.processCode) {
        lastPhase.steps.push(stepView);
      } else {
        phases.push({
          processCode: step.processCode,
          processName: step.processName,
          phaseNumber: phases.length + 1,
          status: step.status,
          steps: [stepView],
        });
      }
    }

    for (const phase of phases) {
      phase.status = phaseStatus(phase.steps.map((s) => s.status));
    }

    return phases;
  });
}

function phaseStatus(statuses: PipelineStepStatus[]): PipelineStepStatus {
  if (statuses.every((s) => s === 'DONE')) {
    return 'DONE';
  }
  if (statuses.some((s) => s === 'CURRENT')) {
    return 'CURRENT';
  }
  return 'UPCOMING';
}
