import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.routes.js';
import { jobsRouter } from './routes/jobs.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';
import { auditRouter } from './routes/audit.routes.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health & Info endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ProofPay API',
    chain: {
      name: 'Arc Testnet',
      chainId: config.arc.chainId,
      rpcUrl: config.arc.rpcUrl,
    },
    partners: ['World', 'Privy', 'Arc'],
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/audit', auditRouter);

app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 ProofPay API Server running on port ${config.port}`);
  console.log(`🌐 Arc Testnet Chain ID: ${config.arc.chainId}`);
  console.log(`🛡️  World ID verify URL: ${config.world.verifyUrl}`);
  console.log(`🔑 Privy Org ID: ${config.privy.orgId}`);
  console.log(`=========================================`);
});
