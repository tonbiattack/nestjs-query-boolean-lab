import { Injectable } from '@nestjs/common';

export type Task = {
  id: string;
  title: string;
  archived: boolean;
};

const TASKS: Task[] = [
  { id: 'active-1', title: '見積もりを確認する', archived: false },
  { id: 'archived-1', title: '前月の報告書を送付する', archived: true },
];

@Injectable()
export class TasksService {
  findAll(includeArchived = false): Task[] {
    if (includeArchived) {
      return TASKS;
    }

    return TASKS.filter((task) => !task.archived);
  }
}
