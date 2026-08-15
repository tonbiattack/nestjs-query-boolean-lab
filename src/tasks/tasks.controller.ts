import { Controller, Get, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Query('includeArchived') includeArchived?: boolean) {
    return this.tasksService.findAll(includeArchived);
  }
}
