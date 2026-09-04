import { checkSystemHealth, printStartupStatus } from './services/health.service.js';

async function main() {
  const health = await checkSystemHealth();
  printStartupStatus(health, 4000);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
