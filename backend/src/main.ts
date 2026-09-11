import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: 'http://localhost:5173', // La URL de tu frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 👇 1. Configuración básica de Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Tickets API')
    .setDescription('Documentación interactiva de la API para la gestión de tickets')
    .setVersion('1.0')
    .addBearerAuth() // Activa el botón para enviar tokens JWT si tienes autenticación
    .build();

  // 👇 2. Creación del documento y configuración de la ruta
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // La ruta será http://localhost:3000/api/docs
  await app.listen(3000);
  console.log(`Servidor corriendo en: http://localhost:3000`);
}
bootstrap();