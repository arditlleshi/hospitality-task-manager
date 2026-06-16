import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  TaskDraft,
  TaskItem,
  TaskListQuery,
  createTaskSaveRequest,
} from '../../features/tasks/task.models';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getTasks(query?: TaskListQuery): Observable<readonly TaskItem[]> {
    let params = new HttpParams();

    if (query?.status) {
      params = params.set('status', query.status);
    }

    if (query?.department) {
      params = params.set('department', query.department);
    }

    if (query?.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<readonly TaskItem[]>(this.apiUrl, { params });
  }

  getTaskById(taskId: number): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.apiUrl}/${taskId}`);
  }

  createTask(draft: TaskDraft): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, createTaskSaveRequest(draft));
  }

  updateTask(taskId: number, draft: TaskDraft): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.apiUrl}/${taskId}`, createTaskSaveRequest(draft));
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}`);
  }
}
