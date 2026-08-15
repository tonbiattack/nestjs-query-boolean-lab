import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Query('includeArchived', new DefaultValuePipe(false), ParseBoolPipe)
    includeArchived: boolean,
  ) {
    return this.tasksService.findAll(includeArchived);
  }
}
