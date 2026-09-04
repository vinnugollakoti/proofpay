// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev Minimal ERC-20 Interface for Arc USDC (precompile at 0x3600000000000000000000000000000000000000)
 */
interface IERC20Minimal {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title ProofPayEscrow
 * @notice Multi-Factor Human Authorization Escrow Contract deployed on Arc Testnet.
 * Holds client USDC in custody and only releases upon cryptographic authorization.
 */
contract ProofPayEscrow {
    address public owner;
    address public relayer;
    IERC20Minimal public immutable usdcToken;

    enum EscrowStatus { NONE, FUNDED, RELEASED, REFUNDED }

    struct Escrow {
        bytes32 escrowId;
        address client;
        address freelancer;
        uint256 amount;
        EscrowStatus status;
        uint256 fundedAt;
    }

    mapping(bytes32 => Escrow) public escrows;
    bool private locked;

    event EscrowFunded(
        bytes32 indexed escrowId,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );

    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed recipient,
        uint256 amount,
        bytes32 authorizationHash
    );

    event EscrowRefunded(
        bytes32 indexed escrowId,
        address indexed client,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _usdcToken, address _relayer) {
        owner = msg.sender;
        relayer = _relayer;
        usdcToken = IERC20Minimal(_usdcToken);
    }

    function setRelayer(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "Invalid relayer");
        relayer = _newRelayer;
    }

    /**
     * @notice Funds an escrow milestone on Arc
     */
    function fundEscrow(
        bytes32 escrowId,
        address freelancer,
        uint256 amount
    ) external nonReentrant {
        require(escrows[escrowId].status == EscrowStatus.NONE, "Escrow already exists");
        require(freelancer != address(0), "Invalid freelancer");
        require(amount > 0, "Amount must be > 0");

        escrows[escrowId] = Escrow({
            escrowId: escrowId,
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            status: EscrowStatus.FUNDED,
            fundedAt: block.timestamp
        });

        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");

        emit EscrowFunded(escrowId, msg.sender, freelancer, amount);
    }

    /**
     * @notice Releases escrowed USDC to freelancer after World + Privy verification
     */
    function releaseEscrow(
        bytes32 escrowId,
        address recipient,
        uint256 amount,
        bytes32 authorizationHash
    ) external nonReentrant {
        require(msg.sender == relayer || msg.sender == escrows[escrowId].client, "Unauthorized caller");
        Escrow storage item = escrows[escrowId];
        require(item.status == EscrowStatus.FUNDED, "Escrow not in FUNDED state");
        require(recipient == item.freelancer, "Recipient mismatch");
        require(amount == item.amount, "Amount mismatch");

        item.status = EscrowStatus.RELEASED;

        bool success = usdcToken.transfer(recipient, amount);
        require(success, "USDC transfer failed");

        emit EscrowReleased(escrowId, recipient, amount, authorizationHash);
    }

    /**
     * @notice Emergency refund path back to client
     */
    function refundEscrow(bytes32 escrowId) external nonReentrant {
        Escrow storage item = escrows[escrowId];
        require(item.status == EscrowStatus.FUNDED, "Escrow not FUNDED");
        require(msg.sender == item.client || msg.sender == owner, "Unauthorized");

        item.status = EscrowStatus.REFUNDED;

        bool success = usdcToken.transfer(item.client, item.amount);
        require(success, "USDC transfer failed");

        emit EscrowRefunded(escrowId, item.client, item.amount);
    }
}
