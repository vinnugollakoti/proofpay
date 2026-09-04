import { getPrisma } from './prisma.js';

async function seed() {
  const prisma = getPrisma();
  if (!prisma) {
    console.error('Prisma client not available');
    process.exit(1);
  }

  console.log('🌱 Seeding Supabase database with Client and Freelancer profiles & jobs...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-acme-design' },
    update: {
      name: 'ACME Design Studio',
      privyOrgId: 'org_acme_design',
      walletAddress: '0x1111111111111111111111111111111111111111',
      maxReleaseLimitUsdc: 5000,
    },
    create: {
      id: 'org-acme-design',
      name: 'ACME Design Studio',
      privyOrgId: 'org_acme_design',
      walletAddress: '0x1111111111111111111111111111111111111111',
      maxReleaseLimitUsdc: 5000,
    },
  });
  console.log('✅ Organization created/verified:', org.name);

  // 2. Create Client User
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@acmedesign.com' },
    update: {
      name: 'Alice (ACME Design)',
      password: 'password123',
      role: 'CLIENT',
      walletAddress: '0xa11ce00000000000000000000000000000000001',
      privyUserId: 'did:privy:alice_client_acme',
      organizationId: org.id,
    },
    create: {
      id: 'user-client-alice',
      name: 'Alice (ACME Design)',
      email: 'client@acmedesign.com',
      password: 'password123',
      role: 'CLIENT',
      walletAddress: '0xa11ce00000000000000000000000000000000001',
      privyUserId: 'did:privy:alice_client_acme',
      organizationId: org.id,
    },
  });
  console.log('✅ Client User created/verified:', clientUser.email);

  // 3. Create Freelancer User
  const freelancerUser = await prisma.user.upsert({
    where: { email: 'freelancer@bobdesigns.io' },
    update: {
      name: 'Bob (Senior Web3 Engineer)',
      password: 'password123',
      role: 'FREELANCER',
      walletAddress: '0xb0b0000000000000000000000000000000000002',
      privyUserId: 'did:privy:bob_freelancer',
    },
    create: {
      id: 'user-freelancer-bob',
      name: 'Bob (Senior Web3 Engineer)',
      email: 'freelancer@bobdesigns.io',
      password: 'password123',
      role: 'FREELANCER',
      walletAddress: '0xb0b0000000000000000000000000000000000002',
      privyUserId: 'did:privy:bob_freelancer',
    },
  });
  console.log('✅ Freelancer User created/verified:', freelancerUser.email);

  // 4. Create Initial Jobs
  const job1 = await prisma.job.upsert({
    where: { id: 'job-demo-landing-page' },
    update: {
      title: 'Design Web3 Fintech Landing Page',
      description: 'Create high-converting landing page UI/UX for ProofPay payments protocol.',
      clientId: clientUser.id,
      organizationId: org.id,
      freelancerId: freelancerUser.id,
      freelancerPayoutAddress: freelancerUser.walletAddress,
      amountUsdc: 500,
      status: 'APPROVED',
      submissionUrl: 'https://www.figma.com/file/proofpay-design-mockups',
      escrowId: '0x7f8a29b3c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    },
    create: {
      id: 'job-demo-landing-page',
      title: 'Design Web3 Fintech Landing Page',
      description: 'Create high-converting landing page UI/UX for ProofPay payments protocol.',
      clientId: clientUser.id,
      organizationId: org.id,
      freelancerId: freelancerUser.id,
      freelancerPayoutAddress: freelancerUser.walletAddress,
      amountUsdc: 500,
      status: 'APPROVED',
      submissionUrl: 'https://www.figma.com/file/proofpay-design-mockups',
      escrowId: '0x7f8a29b3c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    },
  });

  const job2 = await prisma.job.upsert({
    where: { id: 'job-demo-smart-contracts' },
    update: {
      title: 'Next.js Frontend & API Integration',
      description: 'Implement responsive World.org minimalist UI and Privy authentication integration.',
      clientId: clientUser.id,
      organizationId: org.id,
      freelancerId: freelancerUser.id,
      freelancerPayoutAddress: freelancerUser.walletAddress,
      amountUsdc: 850,
      status: 'FUNDED',
      escrowId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    create: {
      id: 'job-demo-smart-contracts',
      title: 'Next.js Frontend & API Integration',
      description: 'Implement responsive World.org minimalist UI and Privy authentication integration.',
      clientId: clientUser.id,
      organizationId: org.id,
      freelancerId: freelancerUser.id,
      freelancerPayoutAddress: freelancerUser.walletAddress,
      amountUsdc: 850,
      status: 'FUNDED',
      escrowId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
  });

  // 5. Seed Audit Events
  await prisma.auditEvent.deleteMany({ where: { jobId: job1.id } });
  await prisma.auditEvent.createMany({
    data: [
      {
        jobId: job1.id,
        eventType: 'JOB_CREATED',
        actorAddress: clientUser.walletAddress,
        actorRole: 'CLIENT',
        metadata: { amountUsdc: 500, title: job1.title },
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
      {
        jobId: job1.id,
        eventType: 'ESCROW_FUNDED',
        actorAddress: clientUser.walletAddress,
        actorRole: 'CLIENT',
        metadata: { amountUsdc: 500, depositMethod: 'Authorized Escrow Deposit' },
        timestamp: new Date(Date.now() - 3600000 * 3),
      },
      {
        jobId: job1.id,
        eventType: 'WORK_SUBMITTED',
        actorAddress: freelancerUser.walletAddress,
        actorRole: 'FREELANCER',
        metadata: { submissionUrl: 'https://www.figma.com/file/proofpay-design-mockups' },
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
      {
        jobId: job1.id,
        eventType: 'WORK_APPROVED',
        actorAddress: clientUser.walletAddress,
        actorRole: 'CLIENT',
        metadata: { note: 'Work verified by client. Milestone approved for release.' },
        timestamp: new Date(Date.now() - 3600000),
      },
    ],
  });

  console.log('🎉 Successfully injected dummy profiles, jobs, and audit events to Supabase!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
