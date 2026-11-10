import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core/core.module.js';
import { ValidationPipe } from './shared/pipes/ValidationPipe.js';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const PORT = process.env.PORT ?? 7000;

  const app = await NestFactory.create(CoreModule);

  app.enableCors();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Пример API')
    .setDescription('Описание API для примера')
    .setVersion('1.0')
    .addTag('example', 'Пример ресурса')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT);
  console.log('Server has started on Port: ', PORT);
}
await bootstrap();
