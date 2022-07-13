async function main() {
  const vaultAddress = '0xFE7aAA953a7e56C8b179cf973CD62F3ED11D6bD6';
  const strategyAddress = '0x74cc9C64894A4bdDce85126EdF3BB766c47BD58A';

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
