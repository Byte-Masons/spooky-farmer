async function main() {
  const vaultAddress = '0x6Ee33e3AeEc0c2AAc970a7c2A65DFF710df85c8A';
  const strategyAddress = '0x79e5198EC4D4AAA2AD3c292085fb0a2cF29197D3';

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
