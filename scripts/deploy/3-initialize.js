async function main() {
  const vaultAddress = '0xA9af46DF21a45D20da73a3020f04255fDF31Eb77';
  const strategyAddress = '0xdd35A19ced92E34D00510f85B2c21db4635dfd3f';

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
