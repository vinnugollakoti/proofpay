// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ProofPayEscrow } from "../src/ProofPayEscrow.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract ProofPayEscrowTest {
    MockUSDC usdc;
    ProofPayEscrow escrow;
    address client = address(0x111);
    address freelancer = address(0x222);
    address relayer = address(0x333);

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new ProofPayEscrow(address(usdc), relayer);
        usdc.mint(client, 1000 * 1e6);
    }

    function test_FundAndRelease() public {
        bytes32 escrowId = keccak256("job-1");
        uint256 amount = 500 * 1e6;

        // Client approves and funds
        usdc.mint(address(this), amount);
        usdc.approve(address(escrow), amount);
        escrow.fundEscrow(escrowId, freelancer, amount);

        // Verify funded status
        (,, address itemFreelancer, uint256 itemAmount, ProofPayEscrow.EscrowStatus status,) = escrow.escrows(escrowId);
        require(itemFreelancer == freelancer, "Freelancer mismatch");
        require(itemAmount == amount, "Amount mismatch");
        require(status == ProofPayEscrow.EscrowStatus.FUNDED, "Status not FUNDED");
    }

    function test_ReleaseEscrowByRelayer() public {
        bytes32 escrowId = keccak256("job-release-1");
        uint256 amount = 500 * 1e6;

        usdc.mint(address(this), amount);
        usdc.approve(address(escrow), amount);
        escrow.fundEscrow(escrowId, freelancer, amount);

        // Relayer releases
        bytes32 authHash = keccak256("valid-auth-hash");
        escrow.releaseEscrow(escrowId, freelancer, amount, authHash);

        require(usdc.balanceOf(freelancer) == amount, "Freelancer did not receive USDC");
        (,,,, ProofPayEscrow.EscrowStatus status,) = escrow.escrows(escrowId);
        require(status == ProofPayEscrow.EscrowStatus.RELEASED, "Status not RELEASED");
    }
}
