import { ChangeDetectionStrategy, Component } from '@angular/core';

type Feature = {
  readonly title: string;
  readonly description: string;
};

type PreviewTask = {
  readonly title: string;
  readonly department: string;
  readonly status: 'Open' | 'In Progress' | 'Done';
};

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly summary = [
    { label: 'Views', value: 'List' },
    { label: 'Statuses', value: '4' },
    { label: 'Teams', value: '5' },
  ] as const;

  protected readonly features: readonly Feature[] = [
    {
      title: 'View All Tasks',
      description:
        'See title, department, status, priority, due date, and created date in one focused list.',
    },
    {
      title: 'Create & Edit Tasks',
      description:
        'Capture operational work quickly and update details without adding unnecessary workflow layers.',
    },
    {
      title: 'Filter By Status',
      description:
        'Switch between All, Open, In Progress, Done, and Cancelled to keep the task list usable.',
    },
    {
      title: 'Basic Validation',
      description:
        'Required fields stay simple: title, department, status, and priority.',
    },
  ];

  protected readonly departments = ['Reception', 'Housekeeping', 'Kitchen', 'Maintenance', 'Management'] as const;

  protected readonly statuses = ['All', 'Open', 'In Progress', 'Done', 'Cancelled'] as const;

  protected readonly previewTasks: readonly PreviewTask[] = [
    { title: 'Clean room 204', department: 'Housekeeping', status: 'Open' },
    { title: 'Check lobby lighting', department: 'Maintenance', status: 'In Progress' },
    { title: 'Prepare terrace setup', department: 'Management', status: 'Done' },
  ];
}
