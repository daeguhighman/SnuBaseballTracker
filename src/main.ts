import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example') // 문서 제목 설정
    .setDescription('The cats API description') // 문서 설명 설정
    .setVersion('1.0') // API 버전 설정
    .addTag('cats') // 태그 추가
    .build();

  // Swagger 문서 생성
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(3000);
}
bootstrap();
