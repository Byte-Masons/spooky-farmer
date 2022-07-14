async function main() {
  const vaultAddress = '0x808341EDfC14Cb54298F87A7BD898998efB97442';
  const strategyAddress = '0x16E8db51047d312fFB673BBB277Ad4c74E99Aa18';

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
