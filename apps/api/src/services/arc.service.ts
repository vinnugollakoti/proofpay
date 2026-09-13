import { ethers } from 'ethers';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export interface SettlementResult {
  settled: boolean;
  status: 'SETTLED' | 'CONFIRMED_ONCHAIN';
  mode: 'PROTOCOL_RECORDED' | 'ONCHAIN';
  txHash?: string;
  explorerUrl?: string;
  blockNumber?: number;
  timestamp: string;
}

export interface FundingResult {
  txHash: string;
  explorerUrl: string;
  blockNumber: number;
  funderAddress: string;
  timestamp: string;
}

export class ArcService {
  private static provider = new ethers.JsonRpcProvider(config.arc.rpcUrl);

  /**
   * Executes or records the release of funds to the freelancer recipient.
   * If a real onchain contract & relayer key are configured, broadcasts the transaction on Arc.
   * Otherwise, cleanly records the verified authorization settlement without phantom hashes.
   */
  static async executeReleaseEscrow(
    escrowId: string,
    recipientAddress: string,
    amountUsdc: number,
    authorizationHash: string
  ): Promise<SettlementResult> {
    const hasValidKey =
      config.arc.relayerPrivateKey &&
      config.arc.relayerPrivateKey.length === 66 &&
      !config.arc.relayerPrivateKey.startsWith('0x0000000000000000000000000000000000000000');

    const hasValidContract =
      config.arc.escrowAddress &&
      config.arc.escrowAddress.length === 42 &&
      !config.arc.escrowAddress.startsWith('0x0000000000000000000000000000000000000000');

    if (config.arc.executeOnchain && hasValidKey && hasValidContract) {
      try {
        const wallet = new ethers.Wallet(config.arc.relayerPrivateKey, this.provider);
        const abi = [
          'function escrows(bytes32) view returns (bytes32 escrowId, address client, address freelancer, uint256 amount, uint8 status, uint256 fundedAt)',
          'function fundEscrow(bytes32 escrowId, address freelancer, uint256 amount) external',
          'function releaseEscrow(bytes32 escrowId, address recipient, uint256 amount, bytes32 authorizationHash) external',
        ];
        const contract = new ethers.Contract(config.arc.escrowAddress, abi, wallet);

        // Convert escrowId to bytes32 safely
        const formattedEscrowId =
          escrowId.startsWith('0x') && escrowId.length === 66
            ? escrowId
            : ethers.id(escrowId);

        // Convert authorizationHash to bytes32 safely
        const formattedAuthHash =
          authorizationHash.startsWith('0x') && authorizationHash.length === 66
            ? authorizationHash
            : ethers.id(authorizationHash || Date.now().toString());

        // Convert USDC to 6 decimals (standard ERC-20 on Arc system contract)
        const amountUnits = ethers.parseUnits(amountUsdc.toString(), 6);

        // Release is never allowed to create a deposit. Funding must have its own
        // confirmed transaction and audit record.
        const escrowRecord = await contract.escrows(formattedEscrowId);
        if (Number(escrowRecord.status) === 0) {
          throw new Error('Escrow does not exist on Arc. Fund the milestone first and wait for its confirmation.');
        }

        logger.arc(`Broadcasting onchain releaseEscrow transaction on Arc Testnet (5042002)...`, {
          contract: config.arc.escrowAddress,
          escrowId: formattedEscrowId,
          recipient: recipientAddress,
          amountUsdc,
        });

        const tx = await contract.releaseEscrow(
          formattedEscrowId,
          recipientAddress,
          amountUnits,
          formattedAuthHash
        );

        logger.arc(`Arc transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();

        logger.arc(`Arc transaction confirmed in block #${receipt.blockNumber}! Explorer: ${config.arc.explorerUrl}/tx/${receipt.hash}`);

        return {
          settled: true,
          status: 'CONFIRMED_ONCHAIN',
          mode: 'ONCHAIN',
          txHash: receipt.hash,
          explorerUrl: `${config.arc.explorerUrl}/tx/${receipt.hash}`,
          blockNumber: receipt.blockNumber,
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        logger.arcError(`Arc onchain execution failed: ${err.message}`);
        throw new Error(`Arc Escrow onchain execution error: ${err.message}`);
      }
    }

    // Honest protocol settlement: Authorization verified (World ID + Privy), settlement recorded
    logger.payment(
      `Payment released and recorded: $${amountUsdc} USDC to ${recipientAddress} (Settlement verified via World ID & Privy policies)`
    );

    return {
      settled: true,
      status: 'SETTLED',
      mode: 'PROTOCOL_RECORDED',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deposits USDC into the deployed escrow contract. This is deliberately
   * separate from release: a job is never marked FUNDED until this receipt is
   * confirmed on Arc.
   */
  static async fundEscrow(escrowId: string, freelancerAddress: string, amountUsdc: number): Promise<FundingResult> {
    if (!config.arc.executeOnchain) {
      throw new Error('On-chain settlement is disabled. Set PROOFPAY_ONCHAIN_SETTLEMENT=true only after verifying the configured Arc wallet, contract, and USDC approval.');
    }
    if (!ethers.isAddress(freelancerAddress)) throw new Error('Freelancer payout address is invalid.');
    if (!config.arc.relayerPrivateKey || !config.arc.escrowAddress || !ethers.isAddress(config.arc.escrowAddress)) {
      throw new Error('Arc funder or escrow contract is not configured.');
    }

    const wallet = new ethers.Wallet(config.arc.relayerPrivateKey, this.provider);
    const formattedEscrowId = escrowId.startsWith('0x') && escrowId.length === 66 ? escrowId : ethers.id(escrowId);
    const amount = ethers.parseUnits(amountUsdc.toString(), 6);
    const usdc = new ethers.Contract(
      config.arc.usdcAddress,
      ['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)'],
      this.provider
    );
    const [balance, allowance] = await Promise.all([
      usdc.balanceOf(wallet.address),
      usdc.allowance(wallet.address, config.arc.escrowAddress),
    ]);
    if (balance < amount) {
      throw new Error(`Insufficient Arc USDC balance. Available ${ethers.formatUnits(balance, 6)} USDC; required ${amountUsdc} USDC.`);
    }
    if (allowance < amount) {
      throw new Error(`Escrow contract allowance is too low. Approved ${ethers.formatUnits(allowance, 6)} USDC; required ${amountUsdc} USDC.`);
    }

    const contract = new ethers.Contract(
      config.arc.escrowAddress,
      ['function fundEscrow(bytes32 escrowId, address freelancer, uint256 amount) external'],
      wallet
    );
    const tx = await contract.fundEscrow(formattedEscrowId, freelancerAddress, amount);
    logger.arc(`Arc escrow funding submitted: ${tx.hash}`, { escrowId: formattedEscrowId, amountUsdc, funder: wallet.address });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error('Arc funding transaction was not confirmed successfully.');
    return {
      txHash: receipt.hash,
      explorerUrl: `${config.arc.explorerUrl}/tx/${receipt.hash}`,
      blockNumber: receipt.blockNumber,
      funderAddress: wallet.address,
      timestamp: new Date().toISOString(),
    };
  }
}
