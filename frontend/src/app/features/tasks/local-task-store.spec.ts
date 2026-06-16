import { TestBed } from '@angular/core/testing';

import { createTaskDraft } from './task.models';
import { LocalTaskStore } from './local-task-store';

describe('LocalTaskStore', () => {
  let store: LocalTaskStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(LocalTaskStore);
  });

  it('creates a task and adds it to the top of the list', () => {
    const beforeCount = store.tasks().length;

    const created = store.createTask({
      title: 'Test task',
      description: 'Created from a unit test',
      department: 'Reception',
      status: 'Open',
      priority: 'Medium',
      dueDate: '',
    });

    expect(store.tasks().length).toBe(beforeCount + 1);
    expect(store.tasks()[0]?.id).toBe(created.id);
    expect(store.tasks()[0]?.title).toBe('Test task');
  });

  it('updates an existing task', () => {
    const existing = store.tasks()[0];
    expect(existing).toBeDefined();

    const updated = store.updateTask(
      existing!.id,
      {
        ...createTaskDraft(existing!),
        title: 'Updated title',
        status: 'Done',
      },
    );

    expect(updated?.title).toBe('Updated title');
    expect(updated?.status).toBe('Done');
  });

  it('deletes an existing task', () => {
    const existing = store.tasks()[0];
    expect(existing).toBeDefined();

    const deleted = store.deleteTask(existing!.id);

    expect(deleted).toBe(true);
    expect(store.tasks().some((task) => task.id === existing!.id)).toBe(false);
  });
});
