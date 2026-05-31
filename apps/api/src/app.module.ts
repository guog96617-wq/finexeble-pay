import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CoreModule } from "./modules/core/core.module";
import { AgentModule } from "./modules/agent/agent.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CoreModule,
    MerchantModule,
    AgentModule,
    PaymentsModule,
  ],
})
export class AppModule {}
