async function main() {
  const vaultAddress = '0x6FbA98c3cA86B6F075eC5d91cA0f38Da86701a3B';
  const strategyAddress = '0xd76c955e071Ad5Ea4A7A8A103c0D8a409d8F7100';

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
