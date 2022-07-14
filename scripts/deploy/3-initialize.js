async function main() {
  const vaultAddress = '0x74642982F24C97Bc46Ed3702ea3D6A22eA7F1BC2';
  const strategyAddress = '0x9D1F0564f39335BEb4450ada81942E7A76C9343E';

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
