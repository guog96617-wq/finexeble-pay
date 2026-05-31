import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET");
        const nodeEnv = config.get<string>("NODE_ENV") ?? "development";
        if (!secret && nodeEnv === "production") {
          throw new Error("JWT_SECRET is required in production.");
        }
        return {
          secret: secret ?? "local-development-jwt-secret-change-before-production",
          signOptions: { expiresIn: "8h" },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
