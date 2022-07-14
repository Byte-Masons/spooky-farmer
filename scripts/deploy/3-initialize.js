async function main() {
  const vaultAddress = '0x0aaf14d7115D4649116e44F6718FA2BBaa5ef220';
  const strategyAddress = '0x53180a6f437DA4B00c8689CCF4aFf9719541Da44';

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
