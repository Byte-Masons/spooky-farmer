async function main() {
  const vaultAddress = '0xC3289666F32D939FcC9f85c074C5CBe211affa0a';
  const strategyAddress = '0x886e81Ab198d4568BD240569ccE082ca2E7FaC8D';

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
