async function main() {
  const vaultAddress = '0xc2c3329fB3aB8c9B52272447863689897CC90B06';
  const strategyAddress = '0x3D248eee3c47Cc65aDBa53a6d2288adE043BAAD8';

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
