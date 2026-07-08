import './instrument';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);

  const port = process.env.PORT || 4000;

  await app.listen(port);
}

bootstrap();
