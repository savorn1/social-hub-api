import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  const port = configService.get<number>('app.port') ?? 3000;
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? [
    'http://localhost:3001',
  ];

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({ origin: corsOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SocialHub API')
    .setDescription('Multi-platform social inbox & chat API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  console.log(
    `🚀 Application running on http://localhost:${port}/${apiPrefix}`,
  );
  console.log(`📚 Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap();
