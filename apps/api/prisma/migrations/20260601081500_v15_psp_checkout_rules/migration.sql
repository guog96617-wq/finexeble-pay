-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'SANDBOX_PAY';

-- AlterTable
ALTER TABLE "withdraws"
ADD COLUMN IF NOT EXISTS "fee_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "actual_payout" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "merchant_channels" (
  "id" TEXT NOT NULL,
  "merchant_id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "is_backup" BOOLEAN NOT NULL DEFAULT false,
  "merchant_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.029,
  "merchant_fixed_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "psp_cost_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.018,
  "psp_fixed_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "agent_commission_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "min_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "max_fee" DECIMAL(18,2),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "merchant_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "withdraw_rules" (
  "id" TEXT NOT NULL,
  "merchant_id" TEXT,
  "agent_id" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "min_amount" DECIMAL(18,2) NOT NULL DEFAULT 1,
  "max_amount" DECIMAL(18,2) NOT NULL DEFAULT 10000,
  "withdraw_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.01,
  "withdraw_fixed_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "settlement_days" INTEGER NOT NULL DEFAULT 1,
  "require_manual_review" BOOLEAN NOT NULL DEFAULT true,
  "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "withdraw_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "agent_fee_rules" (
  "id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL,
  "min_merchant_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.1,
  "min_withdraw_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.01,
  "allowed_payment_methods" JSONB NOT NULL DEFAULT '[]',
  "allowed_supplier_ids" JSONB NOT NULL DEFAULT '[]',
  "allowed_channel_ids" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "agent_fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_channels_merchant_id_channel_id_key" ON "merchant_channels"("merchant_id", "channel_id");
CREATE UNIQUE INDEX IF NOT EXISTS "withdraw_rules_merchant_id_currency_key" ON "withdraw_rules"("merchant_id", "currency");
CREATE UNIQUE INDEX IF NOT EXISTS "withdraw_rules_agent_id_currency_key" ON "withdraw_rules"("agent_id", "currency");
CREATE UNIQUE INDEX IF NOT EXISTS "agent_fee_rules_agent_id_key" ON "agent_fee_rules"("agent_id");

-- AddForeignKey
ALTER TABLE "merchant_channels"
ADD CONSTRAINT "merchant_channels_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "merchant_channels"
ADD CONSTRAINT "merchant_channels_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "withdraw_rules"
ADD CONSTRAINT "withdraw_rules_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "withdraw_rules"
ADD CONSTRAINT "withdraw_rules_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_fee_rules"
ADD CONSTRAINT "agent_fee_rules_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
