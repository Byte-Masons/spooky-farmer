async function main() {
  const vaultAddress = '0x793871761A226524541e72262b9Fe43eCDEfC911';
  const strategyAddress = '0xfcBa2fF4F86701226E1A8d105148C054F8BDEEb9';

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
