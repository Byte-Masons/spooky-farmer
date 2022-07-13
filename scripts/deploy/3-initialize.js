async function main() {
  const vaultAddress = '0xA6c25F27b21BF7E19f2356bEA758221eC05023dF';
  const strategyAddress = '0xf93BAE8C2A998E86f04c9Ad6A88d24847491798d';

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
