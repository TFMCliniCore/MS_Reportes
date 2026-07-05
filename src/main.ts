import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';

// 🚀 Exportamos el documento para que el HealthController pueda servirlo de forma nativa
export let swaggerDocument: any;

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile();

  const app = await NestFactory.create(AppModule);
  
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapterHost));

  // 🎯 Configuración de Swagger para Reportes
  const config = new DocumentBuilder()
    .setTitle('CliniCore - MS Reportes')
    .setDescription('Endpoints para la generación de métricas, estadísticas e informes consolidados')
    .setVersion('1.0')
    .build();

  // Guardamos la referencia global del JSON parseado
  swaggerDocument = SwaggerModule.createDocument(app, config);

  // Dejamos la UI disponible de forma local por si acaso, pero sin jsonDocumentUrl asignado
  SwaggerModule.setup('api/v1/reportes/docs', app, swaggerDocument, {
    swaggerOptions: { jsonEditor: true },
  });

  const port = Number(process.env.PORT ?? 3011);
  await app.listen(port, '0.0.0.0');
  console.log(`MS Reportes corriendo de forma segura en puerto ${port}`);
}
void bootstrap();