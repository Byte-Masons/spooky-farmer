async function main() {
  const vaultAddress = '0x6CF673b45a9960E9D44aAE2b9a11CDE0B330638e';
  const strategyAddress = '0x5e5c186F79710A68D1EFFA241AB7B95063c4fF4f';

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
