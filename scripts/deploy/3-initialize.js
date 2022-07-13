async function main() {
  const vaultAddress = '0x0E70412c4AB1a3C884B34Ea053785Df1A9d949fb';
  const strategyAddress = '0x2C871d787f9Ef538CC45dd07c612b16D2844C542';

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
