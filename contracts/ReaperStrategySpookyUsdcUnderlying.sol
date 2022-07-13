// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./abstract/ReaperBaseStrategyv3.sol";
import "./interfaces/IMasterChef.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniV2Pair.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

/**
 * @dev Deposit SpookySwap LP tokens into MasterChef. Harvest BOO rewards and recompound.
 */
contract ReaperStrategySpookyUsdcUnderlying is ReaperBaseStrategyv3 {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // 3rd-party contract addresses
    address public constant SPOOKY_ROUTER = 0xF491e7B69E4244ad4002BC14e878a34207E38c29;
    address public constant MASTER_CHEF = 0x18b4f774fdC7BF685daeeF66c2990b1dDd9ea6aD;

    /**
     * @dev Tokens Used:
     * {BOO} - Reward token for depositing LP into MasterChef.
     * {USDC} - Token to charge fees and make new LP.
     * {want} - Address of the LP token to farm. (lowercase name for FE compatibility)
     * {lpToken0} - First token of the want LP
     * {lpToken1} - Second token of the want LP
     */
    address public constant BOO = 0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE;
    address public constant USDC = 0x04068DA6C83AFCFA0e13ba15A6696662335D5B75;
    address public want;
    address public lpToken0;
    address public lpToken1;

    /**
     * @dev Paths used to swap tokens:
     * {booToUsdcPath} - to swap {BOO} to {USDC} (using SPOOKY_ROUTER)
     */
    address[] public booToUsdcPath;

    /**
     * @dev Spooky variables.
     * {poolId} - ID of pool in which to deposit LP tokens
     */
    uint256 public poolId;

    /**
     * @dev Initializes the strategy. Sets parameters and saves routes.
     * @notice see documentation for each variable above its respective declaration.
     */
    function initialize(
        address _vault,
        address[] memory _feeRemitters,
        address[] memory _strategists,
        address[] memory _multisigRoles,
        address _want,
        uint256 _poolId
    ) public initializer {
        __ReaperBaseStrategy_init(_vault, _feeRemitters, _strategists, _multisigRoles);
        want = _want;
        poolId = _poolId;
        booToUsdcPath = [BOO, USDC];
        lpToken0 = IUniV2Pair(want).token0();
        lpToken1 = IUniV2Pair(want).token1();
    }

    /**
     * @dev Function that puts the funds to work.
     *      It gets called whenever someone deposits in the strategy's vault contract.
     */
    function _deposit() internal override {
        uint256 wantBalance = IERC20Upgradeable(want).balanceOf(address(this));
        if (wantBalance != 0) {
            IERC20Upgradeable(want).safeIncreaseAllowance(MASTER_CHEF, wantBalance);
            IMasterChef(MASTER_CHEF).deposit(poolId, wantBalance);
        }
    }

    /**
     * @dev Withdraws funds and sends them back to the vault.
     */
    function _withdraw(uint256 _amount) internal override {
        uint256 wantBal = IERC20Upgradeable(want).balanceOf(address(this));
        if (wantBal < _amount) {
            IMasterChef(MASTER_CHEF).withdraw(poolId, _amount - wantBal);
        }

        IERC20Upgradeable(want).safeTransfer(vault, _amount);
    }

    /**
     * @dev Core function of the strat, in charge of collecting and re-investing rewards.
     *      1. Claims {BOO} from the {MASTER_CHEF}.
     *      2. Charge fees.
     *      3. Swap from BOO
     *      4. Creates new LP tokens.
     *      5. Deposits LP in the Master Chef.
     */
    function _harvestCore() internal override returns (uint256 callerFee) {
        IMasterChef(MASTER_CHEF).deposit(poolId, 0); // deposit 0 to claim rewards
        callerFee = _chargeFees();
        _swapFromBoo();
        _addLiquidity();
        deposit();
    }

    /**
     * @dev Core harvest function.
     *      Charges fees based on the amount of BOO gained from reward
     */
    function _chargeFees() internal returns (uint256 callerFee) {
        IERC20Upgradeable boo = IERC20Upgradeable(BOO);
        uint256 booFee = (boo.balanceOf(address(this)) * totalFee) / PERCENT_DIVISOR;
        if (booFee != 0) {
            IERC20Upgradeable usdc = IERC20Upgradeable(USDC);
            uint256 usdcBalBefore = usdc.balanceOf(address(this));
            _swap(booFee, booToUsdcPath);
            uint256 usdcFee = usdc.balanceOf(address(this)) - usdcBalBefore;

            callerFee = (usdcFee * callFee) / PERCENT_DIVISOR;
            uint256 treasuryFeeToVault = (usdcFee * treasuryFee) / PERCENT_DIVISOR;
            uint256 feeToStrategist = (treasuryFeeToVault * strategistFee) / PERCENT_DIVISOR;
            treasuryFeeToVault -= feeToStrategist;

            usdc.safeTransfer(msg.sender, callerFee);
            usdc.safeTransfer(treasury, treasuryFeeToVault);
            usdc.safeTransfer(strategistRemitter, feeToStrategist);
        }
    }

    /**
     * @dev Helper function to swap tokens given an {_amount} and swap {_path}.
     */
    function _swap(uint256 _amount, address[] memory _path) internal {
        if (_path.length < 2 || _amount == 0) {
            return;
        }

        IERC20Upgradeable(_path[0]).safeIncreaseAllowance(SPOOKY_ROUTER, _amount);
        IUniswapV2Router02(SPOOKY_ROUTER).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            _amount,
            0,
            _path,
            address(this),
            block.timestamp
        );
    }

    function _swapFromBoo() internal {
        if (lpToken0 == BOO || lpToken1 == BOO) {
            // USDC-BOO LP
            _swap(IERC20Upgradeable(BOO).balanceOf(address(this)) / 2, booToUsdcPath);
        } else {
            // USDC-X LP, where X != BOO
            _swap(IERC20Upgradeable(BOO).balanceOf(address(this)), booToUsdcPath);
            if (lpToken0 == USDC) {
                address[] memory usdcToLP1 = new address[](2);
                usdcToLP1[0] = USDC;
                usdcToLP1[1] = lpToken1;
                _swap(IERC20Upgradeable(lpToken0).balanceOf(address(this)) / 2, usdcToLP1);
            } else {
                address[] memory usdcToLP0 = new address[](2);
                usdcToLP0[0] = USDC;
                usdcToLP0[1] = lpToken0;
                _swap(IERC20Upgradeable(lpToken1).balanceOf(address(this)) / 2, usdcToLP0);
            }
        }
    }

    /**
     * @dev Core harvest function. Adds more liquidity using {lpToken0} and {lpToken1}.
     */
    function _addLiquidity() internal {
        uint256 lp0Bal = IERC20Upgradeable(lpToken0).balanceOf(address(this));
        uint256 lp1Bal = IERC20Upgradeable(lpToken1).balanceOf(address(this));

        if (lp0Bal != 0 && lp1Bal != 0) {
            IERC20Upgradeable(lpToken0).safeIncreaseAllowance(SPOOKY_ROUTER, lp0Bal);
            IERC20Upgradeable(lpToken1).safeIncreaseAllowance(SPOOKY_ROUTER, lp1Bal);
            IUniswapV2Router02(SPOOKY_ROUTER).addLiquidity(
                lpToken0,
                lpToken1,
                lp0Bal,
                lp1Bal,
                0,
                0,
                address(this),
                block.timestamp
            );
        }
    }

    /**
     * @dev Function to calculate the total {want} held by the strat.
     *      It takes into account both the funds in hand, plus the funds in the MasterChef.
     */
    function balanceOf() public view override returns (uint256) {
        (uint256 amount, ) = IMasterChef(MASTER_CHEF).userInfo(poolId, address(this));
        return amount + IERC20Upgradeable(want).balanceOf(address(this));
    }

    /**
     * Withdraws all funds leaving rewards behind.
     */
    function _reclaimWant() internal override {
        IMasterChef(MASTER_CHEF).emergencyWithdraw(poolId, address(this));
    }
}
