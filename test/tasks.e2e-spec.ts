import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const activeTask = {
  id: 'active-1',
  title: '見積もりを確認する',
  archived: false,
};

const archivedTask = {
  id: 'archived-1',
  title: '前月の報告書を送付する',
  archived: true,
};

describe('GET /tasks', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('includeArchived=falseならアーカイブ済みタスクを返さない', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .query({ includeArchived: false })
      .expect(200);

    expect(response.body).toEqual([activeTask]);
  });

  it('includeArchived=trueならアーカイブ済みタスクも返す', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .query({ includeArchived: true })
      .expect(200);

    expect(response.body).toEqual([activeTask, archivedTask]);
  });

  it('includeArchivedを省略したときはfalseを既定値にする', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .expect(200);

    expect(response.body).toEqual([activeTask]);
  });

  it('真偽値として解釈できない値は400で拒否する', async () => {
    await request(app.getHttpServer())
      .get('/tasks')
      .query({ includeArchived: 'yes' })
      .expect(400);
  });
});
