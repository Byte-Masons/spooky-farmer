async function main() {
  const vaultAddress = '0xAb7f592B1e4ad960461db1A34E150d1d6fD00a75';
  const strategyAddress = '0xa7D67aC94c9b5e12193cbCBEA0850eFC8cA5b80D';

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
