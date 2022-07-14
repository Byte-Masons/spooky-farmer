async function main() {
  const vaultAddress = '0x89f728DD1CbB53a236DAF2706e119ED2da439E6c';
  const strategyAddress = '0xA4De792516Ee47dAB76d7DDbfa3a6ae80259F490';

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
