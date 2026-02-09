// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "v3-core/interfaces/IUniswapV3Factory.sol";
import "v3-core/interfaces/IUniswapV3Pool.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "../interfaces/ISwapRouter.sol";
import "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "../lib/PureSuperToken.sol";

contract TokenLauncher is Ownable, ReentrancyGuard {
  address public UNISWAP_V3_FACTORY;
  address public UNISWAP_V3_POSITION_MANAGER;
  address public SWAP_ROUTER;
  address public WETH;
  address public SUPERTOKEN_FACTORY;

  // Fee tier for the pool (0.3%)
  uint24 public constant POOL_FEE = 3000;

  // Events
  event TokenDeployed(
    address indexed token,
    address indexed pool,
    uint256 indexed positionId,
    uint256 amountToken,
    uint256 amountETH,
    uint256 amountTokensBought
  );
  event FeesCollected(uint256 amount0, uint256 amount1);

  // Mapping to track deployed tokens
  mapping(address => address) public tokenToPool;
  mapping(address => uint256) public tokenToPositionId;

  struct DeploymentParams {
    address uniswapV3Factory;
    address uniswapV3PositionManager;
    address swapRouter;
    address weth;
    address superTokenFactory;
  }

  struct TokenLaunchArgs {
    string name;
    string symbol;
    uint256 initialSupply;
    uint256 amountTokenDesired;
    uint256 amountETHDesired;
    uint256 amountTokenMin;
    uint256 amountETHMin;
  }

  constructor(DeploymentParams memory _params) {
    UNISWAP_V3_FACTORY = _params.uniswapV3Factory;
    UNISWAP_V3_POSITION_MANAGER = _params.uniswapV3PositionManager;
    SWAP_ROUTER = _params.swapRouter;
    WETH = _params.weth;
    SUPERTOKEN_FACTORY = _params.superTokenFactory;
    // Approve position manager to spend WETH
    IERC20(WETH).approve(
      address(UNISWAP_V3_POSITION_MANAGER),
      type(uint256).max
    );
  }

  // Function to deploy a new PureSuperToken, create a Uniswap pool, and add initial liquidity
  function launchToken(
    TokenLaunchArgs memory args
  )
    external
    payable
    onlyOwner
    nonReentrant
    returns (
      address token,
      address pool,
      uint256 positionId,
      uint256 amountTokensBought
    )
  {
    require(msg.value >= args.amountETHDesired, "Insufficient ETH");

    // Deploy the PureSuperToken
    PureSuperToken newToken = new PureSuperToken();
    newToken.initialize(
      SUPERTOKEN_FACTORY, // factory
      args.name,
      args.symbol,
      address(this), // receiver (this contract)
      args.initialSupply
    );
    token = address(newToken);

    // Ensure token is properly initialized
    require(IERC20(token).totalSupply() > 0, "Token not properly initialized");
    require(
      IERC20(token).balanceOf(address(this)) >= args.amountTokenDesired,
      "Insufficient token balance"
    );

    console.log("Token created: ", token);

    // Create the Uniswap V3 pool
    pool = IUniswapV3Factory(UNISWAP_V3_FACTORY).createPool(
      token,
      WETH,
      POOL_FEE
    );

    console.log("Pool created: ", pool);

    // Ensure pool was created successfully
    require(pool != address(0), "Pool creation failed");

    // Initialize the pool with a starting price
    IUniswapV3Pool(pool).initialize(
      uint160(1 << 96) // 1:1 price ratio
    );

    // Store the pool address
    tokenToPool[token] = pool;

    // Wrap ETH to WETH for liquidity provision
    IWETH(WETH).deposit{value: args.amountETHDesired}();

    // Approve token transfer
    IERC20(token).approve(
      address(UNISWAP_V3_POSITION_MANAGER),
      args.amountTokenDesired
    );

    // Create the position
    INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager
      .MintParams({
        token0: token < WETH ? token : WETH,
        token1: token < WETH ? WETH : token,
        fee: POOL_FEE,
        tickLower: -887220, // Min tick
        tickUpper: 887220, // Max tick
        amount0Desired: token < WETH
          ? args.amountTokenDesired
          : args.amountETHDesired,
        amount1Desired: token < WETH
          ? args.amountETHDesired
          : args.amountTokenDesired,
        amount0Min: token < WETH ? args.amountTokenMin : args.amountETHMin,
        amount1Min: token < WETH ? args.amountETHMin : args.amountTokenMin,
        recipient: address(this),
        deadline: block.timestamp + 15 minutes
      });

    (positionId, , , ) = INonfungiblePositionManager(
      UNISWAP_V3_POSITION_MANAGER
    ).mint(params);

    // Store the position ID
    tokenToPositionId[token] = positionId;

    // Perform initial buy if there's remaining ETH
    if (msg.value > args.amountETHDesired) {
      uint256 remainingETH = msg.value - args.amountETHDesired;
      amountTokensBought = _initialBuy(
        token,
        msg.sender, // recipient of bought tokens
        remainingETH
      );
    }

    emit TokenDeployed(
      token,
      pool,
      positionId,
      args.amountTokenDesired,
      args.amountETHDesired,
      amountTokensBought
    );
  }

  // Function to perform initial buy
  function _initialBuy(
    address token,
    address recipient,
    uint256 amountETH
  ) internal returns (uint256 amountTokensBought) {
    // Wrap ETH to WETH
    IWETH(WETH).deposit{value: amountETH}();

    // Approve swap router to spend WETH
    IERC20(WETH).approve(SWAP_ROUTER, amountETH);

    // Swap WETH for tokens
    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
      .ExactInputSingleParams({
        tokenIn: WETH,
        tokenOut: token,
        fee: POOL_FEE,
        recipient: recipient,
        amountIn: amountETH,
        amountOutMinimum: 0, // No minimum for initial buy
        sqrtPriceLimitX96: 0
      });

    amountTokensBought = ISwapRouter(SWAP_ROUTER).exactInputSingle(params);
  }

  // Function to collect fees from the pool
  function collectFees(uint256 tokenId) external onlyOwner nonReentrant {
    INonfungiblePositionManager.CollectParams
      memory params = INonfungiblePositionManager.CollectParams({
        tokenId: tokenId,
        recipient: msg.sender,
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      });

    (uint256 amount0, uint256 amount1) = INonfungiblePositionManager(
      UNISWAP_V3_POSITION_MANAGER
    ).collect(params);

    emit FeesCollected(amount0, amount1);
  }

  // Function to get the pool address for a token
  function getPool(address token) external view returns (address) {
    return tokenToPool[token];
  }

  // Function to get the position ID for a token
  function getPositionId(address token) external view returns (uint256) {
    return tokenToPositionId[token];
  }
}

interface IWETH {
  function deposit() external payable;
}
