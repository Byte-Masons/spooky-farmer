async function main() {
  const vaultAddress = '0xedB0Fc6aE50fB43ee90D18f7A7Ed998156c22D97';
  const strategyAddress = '0x73b6c0d0bBB629984fEBE361875DfEbCaFc17d5e';

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
