import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { rateLimitMiddleware } from "./common/rate-limit.middleware";
import { ResponseInterceptor } from "./common/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = (config.get<string>("CORS_ORIGIN") ?? config.get<string>("FRONTEND_URL") ?? "http://localhost:3000,https://web-production-70ac7.up.railway.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.use(helmet());
  app.use(rateLimitMiddleware);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Global Payment Hub API")
    .setDescription("Starter API for payment aggregation operations")
    .setVersion("1.1")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(config.get<string>("PORT") ?? config.get<string>("API_PORT") ?? 4000);
  await app.listen(port);
}

void bootstrap();
