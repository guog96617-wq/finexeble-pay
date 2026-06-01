import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();
const demoApiSecret = process.env.DEMO_API_SECRET ?? "local-demo-api-secret-change-before-production";

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
    update: { agentId: agent.id },
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

  await prisma.wallet.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      balance: new Prisma.Decimal("12000.00"),
      availableBalance: new Prisma.Decimal("9500.00"),
      frozenBalance: new Prisma.Decimal("2500.00"),
      currency: "USD",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@payhub.local" },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      merchantId: null,
      agentId: null,
    },
    create: {
      email: "admin@payhub.local",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@payhub.local" },
    update: {
      passwordHash: agentPasswordHash,
      role: "AGENT_ADMIN",
      agentId: agent.id,
      merchantId: null,
      status: "ACTIVE",
    },
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
    update: {
      passwordHash: merchantPasswordHash,
      role: "MERCHANT_ADMIN",
      merchantId: merchant.id,
      agentId: null,
      status: "ACTIVE",
    },
    create: {
      email: "merchant@payhub.local",
      passwordHash: merchantPasswordHash,
      role: "MERCHANT_ADMIN",
      merchantId: merchant.id,
      status: "ACTIVE",
    },
  });

  let supplier = await prisma.supplier.findFirst({
    where: { name: "MockPay PSP" },
    include: { channels: true },
  });

  if (!supplier) {
    supplier = await prisma.supplier.create({
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
  }

  let primaryChannel = supplier.channels.find((channel) => channel.name === "MockPay Primary Card");
  if (!primaryChannel) {
    primaryChannel = await prisma.channel.create({
      data: {
        supplierId: supplier.id,
        name: "MockPay Primary Card",
        paymentMethod: "CARD",
        country: "GLOBAL",
        currency: "USD",
        feeRate: new Prisma.Decimal("0.018"),
        priority: 1,
        isPrimary: true,
      },
    });
  }

  if (!supplier.channels.some((channel) => channel.name === "MockPay Backup Card")) {
    await prisma.channel.create({
      data: {
        supplierId: supplier.id,
        name: "MockPay Backup Card",
        paymentMethod: "CARD",
        country: "GLOBAL",
        currency: "USD",
        feeRate: new Prisma.Decimal("0.023"),
        priority: 2,
        isBackup: true,
      },
    });
  }

  let sandboxChannel = supplier.channels.find((channel) => channel.name === "FXpay Sandbox Pay");
  if (!sandboxChannel) {
    sandboxChannel = await prisma.channel.create({
      data: {
        supplierId: supplier.id,
        name: "FXpay Sandbox Pay",
        paymentMethod: "SANDBOX_PAY",
        country: "GLOBAL",
        currency: "USD",
        feeRate: new Prisma.Decimal("0.015"),
        priority: 3,
      },
    });
  }

  const seededChannels = await prisma.channel.findMany({ where: { supplierId: supplier.id, currency: "USD" }, orderBy: [{ isPrimary: "desc" }, { priority: "asc" }] });
  const primaryForMerchant = seededChannels.find((channel) => channel.name === "MockPay Primary Card") ?? seededChannels[0];
  const backupForMerchant = seededChannels.find((channel) => channel.name === "MockPay Backup Card") ?? sandboxChannel;

  await prisma.agentFeeRule.upsert({
    where: { agentId: agent.id },
    update: {
      minMerchantFeeRate: new Prisma.Decimal("0.1000"),
      minWithdrawFeeRate: new Prisma.Decimal("0.0100"),
      allowedPaymentMethods: ["CARD", "LOCAL_PAYMENT", "BANK_TRANSFER", "SANDBOX_PAY"],
      allowedSupplierIds: [supplier.id],
      allowedChannelIds: seededChannels.map((channel) => channel.id),
    },
    create: {
      agentId: agent.id,
      minMerchantFeeRate: new Prisma.Decimal("0.1000"),
      minWithdrawFeeRate: new Prisma.Decimal("0.0100"),
      allowedPaymentMethods: ["CARD", "LOCAL_PAYMENT", "BANK_TRANSFER", "SANDBOX_PAY"],
      allowedSupplierIds: [supplier.id],
      allowedChannelIds: seededChannels.map((channel) => channel.id),
    },
  });

  await prisma.merchantChannel.upsert({
    where: { merchantId_channelId: { merchantId: merchant.id, channelId: primaryForMerchant.id } },
    update: {
      isEnabled: true,
      isPrimary: true,
      isBackup: false,
      merchantFeeRate: new Prisma.Decimal("0.1200"),
      merchantFixedFee: new Prisma.Decimal("0.30"),
      pspCostRate: new Prisma.Decimal("0.0180"),
      pspFixedFee: new Prisma.Decimal("0.10"),
      minFee: new Prisma.Decimal("0.30"),
    },
    create: {
      merchantId: merchant.id,
      channelId: primaryForMerchant.id,
      isEnabled: true,
      isPrimary: true,
      merchantFeeRate: new Prisma.Decimal("0.1200"),
      merchantFixedFee: new Prisma.Decimal("0.30"),
      pspCostRate: new Prisma.Decimal("0.0180"),
      pspFixedFee: new Prisma.Decimal("0.10"),
      minFee: new Prisma.Decimal("0.30"),
    },
  });

  await prisma.merchantChannel.upsert({
    where: { merchantId_channelId: { merchantId: merchant.id, channelId: backupForMerchant.id } },
    update: {
      isEnabled: true,
      isPrimary: false,
      isBackup: true,
      merchantFeeRate: new Prisma.Decimal("0.1200"),
      merchantFixedFee: new Prisma.Decimal("0.30"),
      pspCostRate: new Prisma.Decimal("0.0230"),
      pspFixedFee: new Prisma.Decimal("0.10"),
      minFee: new Prisma.Decimal("0.30"),
    },
    create: {
      merchantId: merchant.id,
      channelId: backupForMerchant.id,
      isEnabled: true,
      isBackup: true,
      merchantFeeRate: new Prisma.Decimal("0.1200"),
      merchantFixedFee: new Prisma.Decimal("0.30"),
      pspCostRate: new Prisma.Decimal("0.0230"),
      pspFixedFee: new Prisma.Decimal("0.10"),
      minFee: new Prisma.Decimal("0.30"),
    },
  });

  await prisma.withdrawRule.upsert({
    where: { merchantId_currency: { merchantId: merchant.id, currency: "USD" } },
    update: {
      minAmount: new Prisma.Decimal("1.00"),
      maxAmount: new Prisma.Decimal("5000.00"),
      withdrawFeeRate: new Prisma.Decimal("0.0150"),
      withdrawFixedFee: new Prisma.Decimal("1.00"),
      settlementDays: 1,
      requireManualReview: true,
    },
    create: {
      merchantId: merchant.id,
      currency: "USD",
      minAmount: new Prisma.Decimal("1.00"),
      maxAmount: new Prisma.Decimal("5000.00"),
      withdrawFeeRate: new Prisma.Decimal("0.0150"),
      withdrawFixedFee: new Prisma.Decimal("1.00"),
      settlementDays: 1,
      requireManualReview: true,
    },
  });

  const apiKey = await prisma.apiKey.upsert({
    where: { apiKey: "pk_demo_global_shop" },
    update: {},
    create: {
      merchantId: merchant.id,
      apiKey: "pk_demo_global_shop",
      apiSecretHash: demoApiSecret,
      status: "ACTIVE",
    },
  });

  const webhook = await prisma.webhook.findFirst({
    where: {
      merchantId: merchant.id,
      url: "https://merchant.example.com/webhooks/payhub",
    },
  });
  if (!webhook) {
    await prisma.webhook.create({
      data: {
        merchantId: merchant.id,
        url: "https://merchant.example.com/webhooks/payhub",
        secret: "whsec_demo",
        status: "ACTIVE",
      },
    });
  }

  const order = await prisma.order.upsert({
    where: { orderNo: "P202600001" },
    update: {},
    create: {
      merchantId: merchant.id,
      channelId: primaryChannel.id,
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
  const walletTransaction = await prisma.walletTransaction.findFirst({
    where: {
      walletId: wallet.id,
      merchantId: merchant.id,
      referenceType: "ORDER",
      referenceId: order.id,
      description: "Seed payment success",
    },
  });
  if (!walletTransaction) {
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
  }

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
    const plugin = await prisma.plugin.findFirst({
      where: {
        platform,
        name: `${platform} PayHub Connector`,
      },
      include: { versions: true },
    });

    if (plugin) {
      if (!plugin.versions.some((version) => version.version === "1.1.0")) {
        await prisma.pluginVersion.create({
          data: {
            pluginId: plugin.id,
            version: "1.1.0",
            downloadUrl: `https://downloads.payhub.local/${platform.toLowerCase()}-1.1.0.zip`,
            releaseNote: "Initial starter package",
          },
        });
      }
      continue;
    }

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

  const seedAuditLog = await prisma.auditLog.findFirst({
    where: {
      action: "seed.completed",
      module: "system",
    },
  });
  if (!seedAuditLog) {
    await prisma.auditLog.create({
      data: {
        action: "seed.completed",
        module: "system",
        afterData: { apiKey: apiKey.apiKey },
      },
    });
  }
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
