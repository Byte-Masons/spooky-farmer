async function main() {
  const vaultAddress = '0x97d25F0175DeA85eaA044Af03405352cBef11772';
  const strategyAddress = '0xB3fa0d1EDFF10176723b8E54F4C0daEaFF0564b0';

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
