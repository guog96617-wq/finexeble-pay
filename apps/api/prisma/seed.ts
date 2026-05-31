import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("Admin123!");
  const agentPasswordHash = await argon2.hash("Agent123!");
  const merchantPasswordHash = await argon2.hash("Merchant123!");

  const agent = await prisma.agent.upsert({
    where: { email: "agent@payhub.local" },
    update: {},
    create: {
      name: "Blue Ocean Agency",
      contactName: "Agent One",
      email: "agent@payhub.local",
      phone: "+85200000001",
      commissionRate: new Prisma.Decimal("0.005"),
      status: "ACTIVE",
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { email: "merchant@payhub.local" },
    update: {},
    create: {
      agentId: agent.id,
      name: "Demo Global Shop",
      contactName: "Merchant One",
      email: "merchant@payhub.local",
      phone: "+85200000002",
      country: "HK",
      website: "https://merchant.example.com",
      status: "ACTIVE",
      feeRate: new Prisma.Decimal("0.029"),
      wallet: {
        create: {
          balance: new Prisma.Decimal("12000.00"),
          availableBalance: new Prisma.Decimal("9500.00"),
          frozenBalance: new Prisma.Decimal("2500.00"),
          currency: "USD",
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@payhub.local" },
    update: {},
    create: {
      email: "admin@payhub.local",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@payhub.local" },
    update: {},
    create: {
      email: "agent@payhub.local",
      passwordHash: agentPasswordHash,
      role: "AGENT_ADMIN",
      agentId: agent.id,
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "merchant@payhub.local" },
    update: {},
    create: {
      email: "merchant@payhub.local",
      passwordHash: merchantPasswordHash,
      role: "MERCHANT_ADMIN",
      merchantId: merchant.id,
      status: "ACTIVE",
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "MockPay PSP",
      country: "SG",
      contactName: "PSP Support",
      email: "support@mockpay.local",
      apiBaseUrl: "https://mockpay.local/api",
      channels: {
        create: [
          {
            name: "MockPay Primary Card",
            paymentMethod: "CARD",
            country: "GLOBAL",
            currency: "USD",
            feeRate: new Prisma.Decimal("0.018"),
            priority: 1,
            isPrimary: true,
          },
          {
            name: "MockPay Backup Card",
            paymentMethod: "CARD",
            country: "GLOBAL",
            currency: "USD",
            feeRate: new Prisma.Decimal("0.023"),
            priority: 2,
            isBackup: true,
          },
        ],
      },
    },
    include: { channels: true },
  });

  const apiKey = await prisma.apiKey.upsert({
    where: { apiKey: "pk_demo_global_shop" },
    update: {},
    create: {
      merchantId: merchant.id,
      apiKey: "pk_demo_global_shop",
      apiSecretHash: "sk_demo_global_shop_secret",
      status: "ACTIVE",
    },
  });

  await prisma.webhook.create({
    data: {
      merchantId: merchant.id,
      url: "https://merchant.example.com/webhooks/payhub",
      secret: "whsec_demo",
      status: "ACTIVE",
    },
  });

  const order = await prisma.order.upsert({
    where: { orderNo: "P202600001" },
    update: {},
    create: {
      merchantId: merchant.id,
      channelId: supplier.channels[0].id,
      orderNo: "P202600001",
      merchantOrderNo: "M202600001",
      amount: new Prisma.Decimal("100.00"),
      currency: "USD",
      feeAmount: new Prisma.Decimal("2.90"),
      netAmount: new Prisma.Decimal("97.10"),
      status: "PAID",
      paymentUrl: "https://checkout.payhub.local/P202600001",
      customerEmail: "buyer@example.com",
      paidAt: new Date("2026-01-01T12:00:00Z"),
    },
  });

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { merchantId: merchant.id } });
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      merchantId: merchant.id,
      type: "PAYMENT_IN",
      amount: new Prisma.Decimal("97.10"),
      balanceAfter: wallet.availableBalance,
      referenceType: "ORDER",
      referenceId: order.id,
      description: "Seed payment success",
    },
  });

  await prisma.withdraw.upsert({
    where: { withdrawNo: "W202600001" },
    update: {},
    create: {
      merchantId: merchant.id,
      withdrawNo: "W202600001",
      amount: new Prisma.Decimal("500.00"),
      currency: "USD",
      bankName: "Demo Bank",
      bankAccount: "000123456789",
      accountName: "Demo Global Shop Ltd",
      status: "PENDING",
    },
  });

  for (const platform of ["SHOPIFY", "WOOCOMMERCE", "SHOPLINE", "MAGENTO", "OPENCART"] as const) {
    await prisma.plugin.create({
      data: {
        name: `${platform} PayHub Connector`,
        platform,
        description: `Starter integration package for ${platform}`,
        versions: {
          create: {
            version: "1.1.0",
            downloadUrl: `https://downloads.payhub.local/${platform.toLowerCase()}-1.1.0.zip`,
            releaseNote: "Initial starter package",
          },
        },
      },
    });
  }

  await prisma.systemConfig.createMany({
    data: [
      { configKey: "platform.name", configValue: "Global Payment Hub", description: "Public platform name" },
      { configKey: "rate.default_fee", configValue: "0.029", description: "Default merchant fee rate" },
      { configKey: "security.rate_limit", configValue: "100/minute", description: "Default API rate limit" },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.create({
    data: {
      action: "seed.completed",
      module: "system",
      afterData: { apiKey: apiKey.apiKey },
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
