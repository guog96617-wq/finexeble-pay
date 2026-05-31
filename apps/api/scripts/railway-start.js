const { spawnSync } = require("child_process");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.SKIP_DB_INIT !== "true") {
  run(process.execPath, ["scripts/railway-db.js", "all"]);
}

require("../dist/src/main.js");
