CREATE TYPE "OwnerType" AS ENUM ('MERCHANT', 'AGENT');
CREATE TYPE "WithdrawAsset" AS ENUM ('USDT', 'USDC');
CREATE TYPE "WithdrawNetwork" AS ENUM ('ERC20', 'TRC20', 'BEP20');
CREATE TYPE "WithdrawAddressStatus" AS ENUM ('ACTIVE');
CREATE TYPE "SettlementRecordStatus" AS ENUM ('FROZEN', 'RELEASED');

ALTER TYPE "WalletTransactionType" ADD VALUE 'AGENT_COMMISSION_IN';
ALTER TYPE "WalletTransactionType" ADD VALUE 'SETTLEMENT_FREEZE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'SETTLEMENT_RELEASE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'WITHDRAW_REQUEST';
ALTER TYPE "WalletTransactionType" ADD VALUE 'WITHDRAW_APPROVED';
ALTER TYPE "WalletTransactionType" ADD VALUE 'WITHDRAW_REJECT_REFUND';

ALTER TABLE "channels"
  ADD COLUMN "settlement_type" TEXT NOT NULL DEFAULT 'T+0',
  ADD COLUMN "settlement_days" INTEGER NOT NULL DEFAULT 0;

UPDATE "channels"
SET "settlement_type" = CASE
    WHEN COALESCE("settlement_days", 0) = 0 THEN 'T+0'
    ELSE CONCAT('T+', "settlement_days"::TEXT)
  END
WHERE "settlement_type" IS NULL;

ALTER TABLE "orders"
  ADD COLUMN "settlement_type" TEXT NOT NULL DEFAULT 'T+0',
  ADD COLUMN "settlement_days" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "settlement_release_at" TIMESTAMP(3);

ALTER TABLE "wallets"
  ADD COLUMN "owner_type" "OwnerType" NOT NULL DEFAULT 'MERCHANT',
  ADD COLUMN "agent_id" TEXT;

ALTER TABLE "wallets" ALTER COLUMN "merchant_id" DROP NOT NULL;
CREATE UNIQUE INDEX "wallets_agent_id_key" ON "wallets"("agent_id");
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
  ADD COLUMN "owner_type" "OwnerType" NOT NULL DEFAULT 'MERCHANT',
  ADD COLUMN "agent_id" TEXT;

ALTER TABLE "wallet_transactions" ALTER COLUMN "merchant_id" DROP NOT NULL;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "withdraws"
  ADD COLUMN "owner_type" "OwnerType" NOT NULL DEFAULT 'MERCHANT',
  ADD COLUMN "owner_id" TEXT,
  ADD COLUMN "agent_id" TEXT,
  ADD COLUMN "withdraw_address_id" TEXT,
  ADD COLUMN "asset" "WithdrawAsset" DEFAULT 'USDT',
  ADD COLUMN "network" "WithdrawNetwork" DEFAULT 'TRC20',
  ADD COLUMN "address_snapshot" TEXT,
  ADD COLUMN "address_label_snapshot" TEXT,
  ADD COLUMN "processed_at" TIMESTAMP(3),
  ADD COLUMN "processed_by" TEXT,
  ADD COLUMN "reject_reason" TEXT;

UPDATE "withdraws" SET "owner_id" = "merchant_id" WHERE "owner_id" IS NULL;
ALTER TABLE "withdraws" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "withdraws" ALTER COLUMN "merchant_id" DROP NOT NULL;
ALTER TABLE "withdraws" ALTER COLUMN "bank_name" DROP NOT NULL;
ALTER TABLE "withdraws" ALTER COLUMN "bank_account" DROP NOT NULL;
ALTER TABLE "withdraws" ALTER COLUMN "account_name" DROP NOT NULL;
ALTER TABLE "withdraws" ADD CONSTRAINT "withdraws_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "withdraw_addresses" (
  "id" TEXT NOT NULL,
  "owner_type" "OwnerType" NOT NULL,
  "owner_id" TEXT NOT NULL,
  "merchant_id" TEXT,
  "agent_id" TEXT,
  "label" TEXT NOT NULL,
  "asset" "WithdrawAsset" NOT NULL,
  "network" "WithdrawNetwork" NOT NULL,
  "address" TEXT NOT NULL,
  "status" "WithdrawAddressStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "withdraw_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "withdraw_addresses_owner_type_owner_id_idx" ON "withdraw_addresses"("owner_type", "owner_id");
ALTER TABLE "withdraw_addresses" ADD CONSTRAINT "withdraw_addresses_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdraw_addresses" ADD CONSTRAINT "withdraw_addresses_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdraws" ADD CONSTRAINT "withdraws_withdraw_address_id_fkey" FOREIGN KEY ("withdraw_address_id") REFERENCES "withdraw_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "settlement_records" (
  "id" TEXT NOT NULL,
  "owner_type" "OwnerType" NOT NULL,
  "owner_id" TEXT NOT NULL,
  "merchant_id" TEXT,
  "agent_id" TEXT,
  "order_id" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "status" "SettlementRecordStatus" NOT NULL DEFAULT 'FROZEN',
  "settlement_days" INTEGER NOT NULL,
  "release_at" TIMESTAMP(3) NOT NULL,
  "released_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "settlement_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "settlement_records_owner_type_owner_id_idx" ON "settlement_records"("owner_type", "owner_id");
CREATE INDEX "settlement_records_status_release_at_idx" ON "settlement_records"("status", "release_at");
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
