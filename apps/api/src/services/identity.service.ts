import { User } from '../types/index.js';
import { db } from '../db/store.js';

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name || user.email?.split('@')[0] || 'ProofPay member',
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress,
    privyUserId: user.privyUserId,
    organizationId: user.organizationId,
  };
}
