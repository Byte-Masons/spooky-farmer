async function main() {
  const vaultAddress = '0x0C420d4F0bbe764d331a6B43d0E24aaC7F371918';
  const strategyAddress = '0xa8867d6DDf80D5c86a3195Fb6c694d806b3FBc32';

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
