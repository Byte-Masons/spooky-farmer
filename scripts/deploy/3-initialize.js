async function main() {
  const vaultAddress = '0x9bb44533bb9737B72Ee4153B3D40928086eEAF44';
  const strategyAddress = '0x0674BB994D1bB256991b98d41BFB9736A0E88094';

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
