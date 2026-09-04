import { ethers } from 'ethers';
import { config } from '../config.js';

export class ArcService {
  private static provider = new ethers.JsonRpcProvider(config.arc.rpcUrl);

  /**
   * Executes the releaseEscrow function on ProofPayEscrow smart contract on Arc.
   */
  static async executeReleaseEscrow(
    escrowId: string,
    recipientAddress: string,
    amountUsdc: number,
    authorizationHash: string
  ): Promise<{ txHash: string; explorerUrl: string; blockNumber?: number }> {
    const isConfigured =
      config.arc.relayerPrivateKey &&
      config.arc.relayerPrivateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000' &&
      config.arc.escrowAddress &&
      config.arc.escrowAddress !== '0x0000000000000000000000000000000000000000';

    if (isConfigured) {
      try {
        const wallet = new ethers.Wallet(config.arc.relayerPrivateKey, this.provider);
        const abi = [
          'function releaseEscrow(bytes32 escrowId, address recipient, uint256 amount, bytes32 authorizationHash) external',
        ];
        const contract = new ethers.Contract(config.arc.escrowAddress, abi, wallet);

        // Convert USDC to 6 decimals (standard ERC-20 on Arc system contract)
        const amountUnits = ethers.parseUnits(amountUsdc.toString(), 6);

        const tx = await contract.releaseEscrow(
          escrowId,
          recipientAddress,
          amountUnits,
          authorizationHash
        );
        const receipt = await tx.wait();

        return {
          txHash: receipt.hash,
          explorerUrl: `${config.arc.explorerUrl}/tx/${receipt.hash}`,
          blockNumber: receipt.blockNumber,
        };
      } catch (err: any) {
        throw new Error(`Arc Escrow onchain execution error: ${err.message}`);
      }
    }

    // Mocked / Local demo fallback on Arc Testnet
    const mockTxHash = `0x${ethers.hexlify(ethers.randomBytes(32)).slice(2)}`;
    return {
      txHash: mockTxHash,
      explorerUrl: `${config.arc.explorerUrl}/tx/${mockTxHash}`,
      blockNumber: 42109,
    };
  }
}
