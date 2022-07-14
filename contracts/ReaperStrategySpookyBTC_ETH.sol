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
contract ReaperStrategySpookyBTC_ETH is ReaperBaseStrategyv3 {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // 3rd-party contract addresses
    address public constant SPOOKY_ROUTER = 0xF491e7B69E4244ad4002BC14e878a34207E38c29;
    address public constant MASTER_CHEF = 0x18b4f774fdC7BF685daeeF66c2990b1dDd9ea6aD;

    /**
     * @dev Tokens Used:
     * {WFTM} - Required for liquidity routing when doing swaps.
     * {BOO} - Reward token for depositing LP into MasterChef.
     * {want} - Address of the LP token to farm. (lowercase name for FE compatibility)
     * {lpToken0} - First token of the want LP
     * {lpToken1} - Second token of the want LP
     */
    address public constant WFTM = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;
    address public constant BOO = 0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE;
    address public constant DAI = 0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E;
    address public want;
    address public lpToken0;
    address public lpToken1;

    /**
     * @dev Paths used to swap tokens:
     * {booToDaiPath} - to swap {BOO} to {DAI} (using SPOOKY_ROUTER)
     * {booToWftmPath} - to swap {BOO} to {WFTM} (using SPOOKY_ROUTER)
     */
    address[] public booToDaiPath;
    address[] public booToWftmPath;

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
        booToDaiPath = [BOO, WFTM, DAI];
        booToWftmPath = [BOO, WFTM];
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
            IERC20Upgradeable dai = IERC20Upgradeable(DAI);
            uint256 daiBalBefore = dai.balanceOf(address(this));
            _swap(booFee, booToDaiPath);
            uint256 daiFee = dai.balanceOf(address(this)) - daiBalBefore;

            callerFee = (daiFee * callFee) / PERCENT_DIVISOR;
            uint256 treasuryFeeToVault = (daiFee * treasuryFee) / PERCENT_DIVISOR;
            uint256 feeToStrategist = (treasuryFeeToVault * strategistFee) / PERCENT_DIVISOR;
            treasuryFeeToVault -= feeToStrategist;

            dai.safeTransfer(msg.sender, callerFee);
            dai.safeTransfer(treasury, treasuryFeeToVault);
            dai.safeTransfer(strategistRemitter, feeToStrategist);
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
            // FTM-BOO LP
            _swap(IERC20Upgradeable(BOO).balanceOf(address(this)) / 2, booToWftmPath);
        } else {
            _swap(IERC20Upgradeable(BOO).balanceOf(address(this)), booToWftmPath);
            if (lpToken0 == WFTM) {
                // FTM-X LP, where X != BOO
                address[] memory wftmToLP1 = new address[](2);
                wftmToLP1[0] = WFTM;
                wftmToLP1[1] = lpToken1;
                _swap(IERC20Upgradeable(lpToken0).balanceOf(address(this)) / 2, wftmToLP1);
            } else if (lpToken1 == WFTM) {
                // X-FTM LP, where X != BOO
                address[] memory wftmToLP0 = new address[](2);
                wftmToLP0[0] = WFTM;
                wftmToLP0[1] = lpToken0;
                _swap(IERC20Upgradeable(lpToken1).balanceOf(address(this)) / 2, wftmToLP0);
            } else {
                // X-Y LP, where neither X nor Y is FTM or BOO, but both X and Y have FTM liquidity
                address[] memory wftmToLP0 = new address[](2);
                wftmToLP0[0] = WFTM;
                wftmToLP0[1] = lpToken0;
                _swap(IERC20Upgradeable(WFTM).balanceOf(address(this)) / 2, wftmToLP0);

                address[] memory wftmToLP1 = new address[](2);
                wftmToLP1[0] = WFTM;
                wftmToLP1[1] = lpToken1;
                _swap(IERC20Upgradeable(WFTM).balanceOf(address(this)), wftmToLP1);
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
