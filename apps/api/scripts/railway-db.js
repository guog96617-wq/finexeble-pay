const { PrismaClient } = require("@prisma/client");
const { spawnSync } = require("child_process");
const path = require("path");

const prisma = new PrismaClient();
const root = process.cwd();
const binExt = process.platform === "win32" ? ".cmd" : "";
const prismaBin = path.join(root, "node_modules", ".bin", `prisma${binExt}`);
const tsxBin = path.join(root, "node_modules", ".bin", `tsx${binExt}`);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function checkSeedUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ["admin@payhub.local", "merchant@payhub.local", "agent@payhub.local"],
      },
    },
    select: {
      email: true,
      role: true,
      status: true,
    },
    orderBy: { email: "asc" },
  });

  console.log(JSON.stringify(users, null, 2));
  if (users.length !== 3) {
    process.exitCode = 1;
  }
}

async function main() {
  const command = process.argv[2] ?? "check";

  if (command === "migrate") {
    run(prismaBin, ["migrate", "deploy", "--schema", "prisma/schema.prisma"]);
    return;
  }

  if (command === "status") {
    run(prismaBin, ["migrate", "status", "--schema", "prisma/schema.prisma"]);
    return;
  }

  if (command === "seed") {
    run(tsxBin, ["prisma/seed.ts"]);
    return;
  }

  if (command === "all") {
    run(prismaBin, ["migrate", "deploy", "--schema", "prisma/schema.prisma"]);
    run(tsxBin, ["prisma/seed.ts"]);
    await checkSeedUsers();
    return;
  }

  await checkSeedUsers();
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
