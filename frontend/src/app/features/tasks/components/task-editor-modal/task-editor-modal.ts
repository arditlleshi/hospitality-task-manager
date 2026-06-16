import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Dialog } from '../../../../shared/components/dialog/dialog';
import { TaskEditorForm } from '../task-editor-form/task-editor-form';

@Component({
  selector: 'app-task-editor-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dialog, TaskEditorForm],
  templateUrl: './task-editor-modal.html',
  styleUrl: './task-editor-modal.scss',
})
export class TaskEditorModal {
  readonly taskId = input<number | null>(null);

  readonly closed = output<void>();
  readonly saved = output<{ readonly title: string; readonly isEdit: boolean }>();
  readonly taskMissing = output<string>();
}
