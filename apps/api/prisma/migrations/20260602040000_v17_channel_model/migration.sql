ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'MERCHANT_FEE_OUT';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'ROLLING_RESERVE_HOLD';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'WITHDRAW_PAID';

CREATE TYPE "RollingReserveStatus" AS ENUM ('HELD', 'RELEASED', 'DEDUCTED');

ALTER TABLE "channels" ALTER COLUMN "supplier_id" DROP NOT NULL;
ALTER TABLE "channels" ADD COLUMN "supplier_name" TEXT;
ALTER TABLE "channels" ADD COLUMN "supplier_contact_name" TEXT;
ALTER TABLE "channels" ADD COLUMN "supplier_api_base_url" TEXT;
ALTER TABLE "channels" ADD COLUMN "supplier_note" TEXT;
ALTER TABLE "channels" ADD COLUMN "psp_cost_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.0200;
ALTER TABLE "channels" ADD COLUMN "psp_fixed_fee" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "channels" ADD COLUMN "rolling_reserve_rate" DECIMAL(8,4) NOT NULL DEFAULT 0;
ALTER TABLE "channels" ADD COLUMN "rolling_reserve_days" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "channels" ADD COLUMN "description" TEXT;

UPDATE "channels" c
SET
  "supplier_name" = COALESCE(c."supplier_name", s."name"),
  "supplier_contact_name" = COALESCE(c."supplier_contact_name", s."contact_name"),
  "supplier_api_base_url" = COALESCE(c."supplier_api_base_url", s."api_base_url"),
  "psp_cost_rate" = c."fee_rate"
FROM "suppliers" s
WHERE c."supplier_id" = s."id";

CREATE TABLE "agent_channels" (
  "id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "agent_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0.1000,
  "agent_fixed_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_channels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_channels_agent_id_channel_id_key" ON "agent_channels"("agent_id", "channel_id");
ALTER TABLE "agent_channels" ADD CONSTRAINT "agent_channels_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_channels" ADD CONSTRAINT "agent_channels_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "agent_channels" ("id", "agent_id", "channel_id", "is_enabled", "agent_fee_rate", "agent_fixed_fee", "note", "created_at", "updated_at")
SELECT
  concat('acl_', md5(a."id" || c."id")),
  a."id",
  c."id",
  true,
  0.1000,
  0,
  'Migrated from V1.6 allowed channel rule',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "agents" a
CROSS JOIN "channels" c
ON CONFLICT ("agent_id", "channel_id") DO NOTHING;

ALTER TABLE "wallets" ADD COLUMN "rolling_reserve_balance" DECIMAL(18,2) NOT NULL DEFAULT 0;

ALTER TABLE "orders" ADD COLUMN "merchant_fee_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "agent_profit_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "platform_profit_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "psp_cost_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "merchant_net_before_reserve" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "rolling_reserve_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "merchant_available_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;

CREATE TABLE "rolling_reserve_records" (
  "id" TEXT NOT NULL,
  "merchant_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "status" "RollingReserveStatus" NOT NULL DEFAULT 'HELD',
  "hold_days" INTEGER NOT NULL DEFAULT 0,
  "release_at" TIMESTAMP(3),
  "released_at" TIMESTAMP(3),
  "deducted_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rolling_reserve_records_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "rolling_reserve_records" ADD CONSTRAINT "rolling_reserve_records_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rolling_reserve_records" ADD CONSTRAINT "rolling_reserve_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rolling_reserve_records" ADD CONSTRAINT "rolling_reserve_records_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "merchant_channels" DROP COLUMN IF EXISTS "psp_cost_rate";
ALTER TABLE "merchant_channels" DROP COLUMN IF EXISTS "psp_fixed_fee";
ALTER TABLE "merchant_channels" DROP COLUMN IF EXISTS "agent_commission_rate";
