async function main() {
  const vaultAddress = '0xB27181d1910e07545Fc15841D9FC6A1d95C9f4bF';
  const strategyAddress = '0x379d6092A94946cd09525F806737779acf8559AA';

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
