async function main() {
  const vaultAddress = '0xBE593b12995E87a5Ff584339c29e057474Dd6B59';
  const strategyAddress = '0xfD584e74F98796F16A2ece08CE416EAd5157E735';

  const Vault = await ethers.getContractFactory('ReaperVaultv1_4');
  const vault = Vault.attach(vaultAddress);

  await vault.initialize(strategyAddress);
  console.log('Vault initialized');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
