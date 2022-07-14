async function main() {
  const vaultAddress = '0xcfF6d40c0369EBE08F25157aF8A2e97aa5358Dc5';
  const strategyAddress = '0xb77149ECd49078e6B7C09D9fD84bE610B6A475E8';

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
