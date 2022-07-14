async function main() {
  const vaultAddress = '0x2bC4BED40e0903882f72D762D2449Fb7b1BeC4A0';
  const strategyAddress = '0x98137faf9bf9B191A5Aa9914675D6594aD759136';

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
