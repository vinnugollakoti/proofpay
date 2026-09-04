function formatTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m',
};

export const logger = {
  http: (
    method: string,
    url: string,
    status: number,
    durationMs: number,
    errorMsg?: string,
    requestBody?: any
  ) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    const statusColor = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green;
    const methodFormatted = `${colors.bold}${method.padEnd(6)}${colors.reset}`;
    const statusFormatted = `${statusColor}${status}${colors.reset}`;

    if (errorMsg) {
      console.error(
        `${time} ❌ [HTTP ${statusFormatted}] ${methodFormatted} ${url} (${durationMs}ms) — ${colors.red}${errorMsg}${colors.reset}`
      );
      if (requestBody && Object.keys(requestBody).length > 0) {
        console.error(
          `   ${colors.dim}Payload causing failure:${colors.reset}`,
          JSON.stringify(requestBody, null, 2)
        );
      }
    } else {
      console.log(
        `${time} ➡️  [HTTP ${statusFormatted}] ${methodFormatted} ${url} (${durationMs}ms)`
      );
    }
  },

  world: (message: string, data?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.log(`\n${colors.cyan}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${time} 🌐 ${colors.bold}[WORLD ID 3.0 / v4]${colors.reset} ${colors.cyan}${message}${colors.reset}`);
    if (data !== undefined) {
      console.log(`   ${colors.dim}Data:${colors.reset}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }
    console.log(`${colors.cyan}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  },

  worldError: (message: string, error?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.error(`\n${colors.red}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.error(`${time} 🔴 ${colors.bold}[WORLD ID ERROR]${colors.reset} ${colors.red}${message}${colors.reset}`);
    if (error !== undefined) {
      console.error(`   ${colors.dim}Error Detail:${colors.reset}`, typeof error === 'object' ? JSON.stringify(error, null, 2) : error);
    }
    console.error(`${colors.red}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  },

  privy: (message: string, data?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.log(`\n${colors.magenta}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${time} 🔑 ${colors.bold}[PRIVY POLICY ENGINE]${colors.reset} ${colors.magenta}${message}${colors.reset}`);
    if (data !== undefined) {
      console.log(`   ${colors.dim}Policy Evaluation:${colors.reset}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }
    console.log(`${colors.magenta}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  },

  privyError: (message: string, error?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.error(`\n${colors.red}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.error(`${time} 🔴 ${colors.bold}[PRIVY POLICY VIOLATION]${colors.reset} ${colors.red}${message}${colors.reset}`);
    if (error !== undefined) {
      console.error(`   ${colors.dim}Violation Details:${colors.reset}`, typeof error === 'object' ? JSON.stringify(error, null, 2) : error);
    }
    console.error(`${colors.red}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  },

  arc: (message: string, data?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.log(`\n${colors.cyan}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${time} ⛓️  ${colors.bold}[ARC SETTLEMENT (5042002)]${colors.reset} ${colors.cyan}${message}${colors.reset}`);
    if (data !== undefined) {
      console.log(`   ${colors.dim}Arc Execution:${colors.reset}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }
    console.log(`${colors.cyan}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  },

  arcError: (message: string, error?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.error(`\n${colors.red}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.error(`${time} 🔴 ${colors.bold}[ARC EXECUTION ERROR]${colors.reset} ${colors.red}${message}${colors.reset}`);
    if (error !== undefined) {
      console.error(`   ${colors.dim}Error Details:${colors.reset}`, typeof error === 'object' ? JSON.stringify(error, null, 2) : error);
    }
    console.error(`${colors.red}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
  },

  payment: (message: string, data?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.log(`${time} 💳 [PAYMENT] ${colors.green}${message}${colors.reset}`, data !== undefined ? data : '');
  },

  paymentError: (message: string, error?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.error(
      `${time} ❌ [PAYMENT ERROR] ${colors.red}${message}${colors.reset}`,
      error !== undefined ? error : ''
    );
  },

  db: (message: string, data?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.log(`${time} 🗄️  [DATABASE] ${colors.cyan}${message}${colors.reset}`, data !== undefined ? data : '');
  },

  dbError: (message: string, error?: any) => {
    const time = `${colors.dim}${formatTimestamp()}${colors.reset}`;
    console.error(
      `${time} 🔴 [DATABASE ERROR] ${colors.red}${message}${colors.reset}`,
      error !== undefined ? error : ''
    );
  },
};
