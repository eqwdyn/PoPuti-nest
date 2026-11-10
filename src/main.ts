import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core/core.module.js';

async function bootstrap() {
  const PORT = process.env.PORT ?? 7000;

  const app = await NestFactory.create(CoreModule);

  await app.listen(PORT);
  console.log('Server has started on Port: ', PORT);
}
await bootstrap();
