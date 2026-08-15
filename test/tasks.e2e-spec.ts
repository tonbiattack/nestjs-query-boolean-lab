import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

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

    expect(response.body).toEqual([
      {
        id: 'active-1',
        title: '見積もりを確認する',
        archived: false,
      },
    ]);
  });
});
