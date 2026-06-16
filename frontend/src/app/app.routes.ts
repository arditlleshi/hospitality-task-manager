import { Routes } from '@angular/router';

import { TaskFormPage } from './features/tasks/pages/task-form-page/task-form-page';
import { TaskListPage } from './features/tasks/pages/task-list-page/task-list-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tasks',
    pathMatch: 'full',
  },
  {
    path: 'tasks',
    component: TaskListPage,
    title: 'Hospitality Task Manager | Tasks',
  },
  {
    path: 'tasks/new',
    component: TaskFormPage,
    title: 'Hospitality Task Manager | Create Task',
  },
  {
    path: 'tasks/:taskId/edit',
    component: TaskFormPage,
    title: 'Hospitality Task Manager | Edit Task',
  },
  {
    path: '**',
    redirectTo: 'tasks',
  },
];
