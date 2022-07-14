async function main() {
  const vaultAddress = '0xF49e932986e8200972028DE10Cee5C0678874767';
  const strategyAddress = '0xd9D6B72D92725Eaf2A14667c8a289C8A273C5Eb2';

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
