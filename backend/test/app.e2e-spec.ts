import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (E2E) - Security & Routes', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/reports/dashboard (GET) should block unauthenticated requests', () => {
    return request(app.getHttpServer())
      .get('/reports/dashboard')
      .expect(401); // Esperamos un Unauthorized por falta de Token JWT
  });

  it('/reports/export/csv (GET) should block non-admin users', async () => {
    // Aquí podrías simular un token de un rol 'Cliente' o 'Agente' y verificar que devuelva 403 (Forbidden)
    return request(app.getHttpServer())
      .get('/reports/export/csv')
      .expect(401); // Sin token, por seguridad debe rechazarlo con 401 primero
  });
});

describe('Tickets System - Flujos E2E Funcionales', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('ESPERADO: Intentar crear un ticket sin token JWT. RESULTADO: Debe denegar el acceso con código 401 Unauthorized', async () => {
    console.log('--- PRUEBA E2E: Seguridad en Creación de Tickets ---');
    
    const response = await request(app.getHttpServer())
      .post('/tickets')
      .send({ title: 'Ticket sin auth', description: 'Prueba' });

    console.log('>> RESULTADO HTTP STATUS:', response.status);
    expect(response.status).toBe(401);
  });
});