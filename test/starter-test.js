const hre = require('hardhat');
const chai = require('chai');
const {solidity} = require('ethereum-waffle');
chai.use(solidity);
const {expect} = chai;

const moveTimeForward = async (seconds) => {
  await network.provider.send('evm_increaseTime', [seconds]);
  await network.provider.send('evm_mine');
};

// use with small values in case harvest is block-dependent instead of time-dependent
const moveBlocksForward = async (blocks) => {
  for (let i = 0; i < blocks; i++) {
    await network.provider.send('evm_increaseTime', [1]);
    await network.provider.send('evm_mine');
  }
};

const toWantUnit = (num, isUSDC = false) => {
  if (isUSDC) {
    return ethers.BigNumber.from(num * 10 ** 8);
  }
  return ethers.utils.parseEther(num);
};

describe('Vaults', function () {
  let Vault;
  let vault;

  let Strategy;
  let strategy;

  let Want;
  let want;
  let boo;
  let sd;

  const treasuryAddr = '0x0e7c5313E9BB80b654734d9b7aB1FB01468deE3b';
  const paymentSplitterAddress = '0x63cbd4134c2253041F370472c130e92daE4Ff174';
  const wantAddress = '0xE67980fc955FECfDA8A92BbbFBCc9f0C4bE60A9A';
  const mcPoolId = 4;

  const wantHolderAddr = '0x9dadb5473a1672fbc8f2441d1d1522ac06f67880';
  const strategistAddr = '0x1A20D7A31e5B3Bc5f02c8A146EF6f394502a10c4';

  const booAddress = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';
  const booHolderAddr = '0xf778F4D7a14A8CB73d5261f9C61970ef4E7D7842';

  const sdAddress = '0x412a13C109aC30f0dB80AD3Bd1DeFd5D0A6c0Ac6';
  const sdHolderAddr = '0x9dadb5473a1672fbc8f2441d1d1522ac06f67880';

  let owner;
  let wantHolder;
  let strategist;
  let booHolder;
  let sdHolder;

  beforeEach(async function () {
    //reset network
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: 'https://rpc.ftm.tools/',
            // blockNumber: 36936538,
          },
        },
      ],
    });

    //get signers
    [owner] = await ethers.getSigners();
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [wantHolderAddr],
    });
    wantHolder = await ethers.provider.getSigner(wantHolderAddr);
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [strategistAddr],
    });
    strategist = await ethers.provider.getSigner(strategistAddr);
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [booHolderAddr],
    });
    booHolder = await ethers.provider.getSigner(booHolderAddr);
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [sdHolderAddr],
    });
    sdHolder = await ethers.provider.getSigner(sdHolderAddr);

    //get artifacts
    Vault = await ethers.getContractFactory('ReaperVaultv1_4');
    Strategy = await ethers.getContractFactory('ReaperStrategySpookysFTMX');
    Want = await ethers.getContractFactory('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20');

    //deploy contracts
    vault = await Vault.deploy(wantAddress, 'FTM-DEUS Spooky Crypt', 'rf-sp-FTM-DEUS', 0, ethers.constants.MaxUint256);
    strategy = await hre.upgrades.deployProxy(
      Strategy,
      [vault.address, [treasuryAddr, paymentSplitterAddress], [strategistAddr], wantAddress, mcPoolId],
      {kind: 'uups'},
    );
    await strategy.deployed();
    await vault.initialize(strategy.address);
    want = await Want.attach(wantAddress);
    boo = await Want.attach(booAddress);
    sd = await Want.attach(sdAddress);

    //approving LP token and vault share spend
    await want.connect(wantHolder).approve(vault.address, ethers.constants.MaxUint256);
  });

  xdescribe('Deploying the vault and strategy', function () {
    it('should initiate vault with a 0 balance', async function () {
      const totalBalance = await vault.balance();
      const availableBalance = await vault.available();
      const pricePerFullShare = await vault.getPricePerFullShare();
      expect(totalBalance).to.equal(0);
      expect(availableBalance).to.equal(0);
      expect(pricePerFullShare).to.equal(ethers.utils.parseEther('1'));
    });
  });

  xdescribe('Vault Tests', function () {
    it('should allow deposits and account for them correctly', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const vaultBalance = await vault.balance();
      const depositAmount = toWantUnit('10');
      await vault.connect(wantHolder).deposit(depositAmount);

      const newVaultBalance = await vault.balance();
      const newUserBalance = await want.balanceOf(wantHolderAddr);
      const allowedInaccuracy = depositAmount.div(200);
      expect(depositAmount).to.be.closeTo(newVaultBalance, allowedInaccuracy);
    });

    it('should mint user their pool share', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('10');
      await vault.connect(wantHolder).deposit(depositAmount);

      const ownerDepositAmount = toWantUnit('0.1');
      await want.connect(wantHolder).transfer(owner.address, ownerDepositAmount);
      await want.connect(owner).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(owner).deposit(ownerDepositAmount);

      const allowedImprecision = toWantUnit('0.0001');

      const userVaultBalance = await vault.balanceOf(wantHolderAddr);
      expect(userVaultBalance).to.be.closeTo(depositAmount, allowedImprecision);
      const ownerVaultBalance = await vault.balanceOf(owner.address);
      expect(ownerVaultBalance).to.be.closeTo(ownerDepositAmount, allowedImprecision);

      await vault.connect(owner).withdrawAll();
      const ownerWantBalance = await want.balanceOf(owner.address);
      expect(ownerWantBalance).to.be.closeTo(ownerDepositAmount, allowedImprecision);
      const afterOwnerVaultBalance = await vault.balanceOf(owner.address);
      expect(afterOwnerVaultBalance).to.equal(0);
    });

    it('should allow withdrawals', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('10');
      await vault.connect(wantHolder).deposit(depositAmount);

      await vault.connect(wantHolder).withdrawAll();
      const newUserVaultBalance = await vault.balanceOf(wantHolderAddr);
      const userBalanceAfterWithdraw = await want.balanceOf(wantHolderAddr);

      const securityFee = 10;
      const percentDivisor = 10000;
      const withdrawFee = depositAmount.mul(securityFee).div(percentDivisor);
      const expectedBalance = userBalance.sub(withdrawFee);
      const smallDifference = expectedBalance.div(200);
      const isSmallBalanceDifference = expectedBalance.sub(userBalanceAfterWithdraw) < smallDifference;
      expect(isSmallBalanceDifference).to.equal(true);
    });

    it('should allow small withdrawal', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('0.0000001');
      await vault.connect(wantHolder).deposit(depositAmount);

      const ownerDepositAmount = toWantUnit('0.1');
      await want.connect(wantHolder).transfer(owner.address, ownerDepositAmount);
      await want.connect(owner).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(owner).deposit(ownerDepositAmount);

      await vault.connect(wantHolder).withdrawAll();
      const newUserVaultBalance = await vault.balanceOf(wantHolderAddr);
      const userBalanceAfterWithdraw = await want.balanceOf(wantHolderAddr);

      const securityFee = 10;
      const percentDivisor = 10000;
      const withdrawFee = depositAmount.mul(securityFee).div(percentDivisor);
      const expectedBalance = userBalance.sub(withdrawFee);
      const smallDifference = expectedBalance.div(200);
      const isSmallBalanceDifference = expectedBalance.sub(userBalanceAfterWithdraw) < smallDifference;
      expect(isSmallBalanceDifference).to.equal(true);
    });

    it('should handle small deposit + withdraw', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('0.0000000000001');
      await vault.connect(wantHolder).deposit(depositAmount);

      await vault.connect(wantHolder).withdraw(depositAmount);
      const newUserVaultBalance = await vault.balanceOf(wantHolderAddr);
      const userBalanceAfterWithdraw = await want.balanceOf(wantHolderAddr);

      const securityFee = 10;
      const percentDivisor = 10000;
      const withdrawFee = (depositAmount * securityFee) / percentDivisor;
      const expectedBalance = userBalance.sub(withdrawFee);
      const isSmallBalanceDifference = expectedBalance.sub(userBalanceAfterWithdraw) < 200;
      expect(isSmallBalanceDifference).to.equal(true);
    });

    it('should be able to harvest', async function () {
      await vault.connect(wantHolder).deposit(toWantUnit('15'));
      await moveBlocksForward(100);
      await strategy.harvest();
    });

    it('should provide yield', async function () {
      const timeToSkip = 3600;
      const userBalance = await want.balanceOf(wantHolderAddr);
      await vault.connect(wantHolder).deposit(userBalance);
      const initialVaultBalance = await vault.balance();

      await strategy.updateHarvestLogCadence(1);

      const numHarvests = 5;
      boo = Want.attach(booAddress);
      for (let i = 0; i < numHarvests; i++) {
        // await boo.connect(booHolder).transfer(strategy.address, toWantUnit('1'));
        // await sd.connect(sdHolder).transfer(strategy.address, toWantUnit('1'));
        await moveTimeForward(timeToSkip);
        await moveBlocksForward(100);
        await strategy.harvest();
      }

      const finalVaultBalance = await vault.balance();
      expect(finalVaultBalance).to.be.gt(initialVaultBalance);

      const averageAPR = await strategy.averageAPRAcrossLastNHarvests(numHarvests);
      console.log(`Average APR across ${numHarvests} harvests is ${averageAPR} basis points.`);
    });
  });
  xdescribe('Strategy', function () {
    it('should be able to pause and unpause', async function () {
      await strategy.pause();
      const depositAmount = toWantUnit('1');
      await expect(vault.connect(wantHolder).deposit(depositAmount)).to.be.reverted;

      await strategy.unpause();
      await expect(vault.connect(wantHolder).deposit(depositAmount)).to.not.be.reverted;
    });

    it('should be able to panic', async function () {
      const depositAmount = toWantUnit('0.0007');
      await vault.connect(wantHolder).deposit(depositAmount);
      const vaultBalance = await vault.balance();
      const strategyBalance = await strategy.balanceOf();
      await strategy.panic();

      const wantStratBalance = await want.balanceOf(strategy.address);
      const allowedImprecision = toWantUnit('0.000000001');
      expect(strategyBalance).to.be.closeTo(wantStratBalance, allowedImprecision);
    });

    it('should be able to retire strategy', async function () {
      const depositAmount = toWantUnit('10');
      await vault.connect(wantHolder).deposit(depositAmount);
      await moveBlocksForward(100);
      const vaultBalance = await vault.balance();
      const strategyBalance = await strategy.balanceOf();
      expect(vaultBalance).to.equal(strategyBalance);

      await expect(strategy.retireStrat()).to.not.be.reverted;
      const newVaultBalance = await vault.balance();
      const newStrategyBalance = await strategy.balanceOf();
      const allowedImprecision = toWantUnit('0.001');
      if (newVaultBalance.lt(vaultBalance)) {
        expect(newVaultBalance).to.be.closeTo(vaultBalance, allowedImprecision);
      }
      expect(newStrategyBalance).to.be.lt(allowedImprecision);
    });

    it('should be able to retire strategy with no balance', async function () {
      await expect(strategy.retireStrat()).to.not.be.reverted;
    });

    it('should be able to estimate harvest', async function () {
      const whaleDepositAmount = toWantUnit('10');
      await vault.connect(wantHolder).deposit(whaleDepositAmount);
      await moveBlocksForward(100);
      await strategy.harvest();
      await moveBlocksForward(100);
      const [profit, callFeeToUser] = await strategy.estimateHarvest();
      console.log(`profit: ${profit}`);
      const hasProfit = profit.gt(0);
      const hasCallFee = callFeeToUser.gt(0);
      expect(hasProfit).to.equal(true);
      expect(hasCallFee).to.equal(true);
    });
  });

  describe('Deployed Mainnet contracts', function () {
    // async function forkMainnetAndAttachToDeployedStrategy() {
    //   await network.provider.request({
    //     method: 'hardhat_reset',
    //     params: [
    //       {
    //         forking: {
    //           jsonRpcUrl: 'https://rpc.ankr.com/fantom/',
    //         },
    //       },
    //     ],
    //   });
    //   const Strategy = await ethers.getContractFactory('ReaperStrategySpookysFTMX');
    //   const strategy = await Strategy.attach('0x873c088A05AfB0F254fe97b8A6677ee41a3F61BD');
    //   const strategist = await ethers.getImpersonatedSigner(strategistAddr);

    //   return {strategy, strategist};
    // }

    // to run this test, replace the contents of unknown-31337.json with the contents of unknown-250.json
    it('upgrade to V2', async function () {
      await network.provider.request({
        method: 'hardhat_reset',
        params: [
          {
            forking: {
              jsonRpcUrl: 'https://rpc.ankr.com/fantom/',
            },
          },
        ],
      });
      const Strategy = await ethers.getContractFactory('ReaperStrategySpookysFTMXOld');
      const strategy = await Strategy.attach('0x873c088A05AfB0F254fe97b8A6677ee41a3F61BD');
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [strategistAddr],
      });
      const strategist = await ethers.provider.getSigner(strategistAddr);

      // const {strategy} = await loadFixture(forkMainnetAndAttachToDeployedStrategy); 
      await moveTimeForward(3600 * 6);

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: ['0x111731A388743a75CF60CCA7b140C58e41D83635'],
      });
      const defaultAdmin = await ethers.provider.getSigner('0x111731A388743a75CF60CCA7b140C58e41D83635');

      // const defaultAdmin = await ethers.getImpersonatedSigner('0x111731A388743a75CF60CCA7b140C58e41D83635');
      const StrategyV2 = await ethers.getContractFactory('ReaperStrategySpookysFTMX');
      console.log('Got old strat');

      const newImplAddress = await upgrades.prepareUpgrade(strategy.address, StrategyV2);
      console.log('Got future add');
      await strategy.connect(defaultAdmin).upgradeTo(newImplAddress);
      console.log('Upgrading')

      // verify that upgrade completed
      const strategyV2 = await StrategyV2.attach(strategy.address);
      const txTransfer = await strategyV2.connect(defaultAdmin).transferWantToNewMasterchef();
      const v2UpgradeCompleted = await strategyV2.isMigrationDone();
      expect(v2UpgradeCompleted).to.eq(true);

      // harvest 3 times and read APR
      const numHarvests = 3;
      for (let i = 0; i < numHarvests; i++) {
        await moveTimeForward(3600 * 24);
        await strategyV2.harvest();
      }

      const averageAPR = await strategyV2.averageAPRAcrossLastNHarvests(numHarvests - 1);
      console.log(`Supply-borrow average APR across ${numHarvests - 1} harvests is ${averageAPR} basis points.`);
    });


  });
});
