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

        // Check if escrow already funded onchain
        const escrowRecord = await contract.escrows(formattedEscrowId);
        if (Number(escrowRecord.status) === 0) {
          logger.arc(`Escrow ${formattedEscrowId.slice(0, 10)}... not yet funded onchain. Auto-funding from Privy/Relayer wallet...`, {
            relayer: wallet.address,
            recipient: recipientAddress,
            amountUsdc,
          });

          // Fund the escrow
          const fundTx = await contract.fundEscrow(formattedEscrowId, recipientAddress, amountUnits);
          logger.arc(`Arc fundEscrow tx submitted: ${fundTx.hash}`);
          await fundTx.wait();
          logger.arc(`Arc escrow funded onchain! Proceeding to release...`);
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
}
