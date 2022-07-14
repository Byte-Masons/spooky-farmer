async function main() {
  const vaultAddress = '0x3da3fd87128B4Be7c2517e104bE1edaB531d942D';
  const strategyAddress = '0x003cbD9F780beF9147C3F0341Bf32a24Aab63b81';

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
