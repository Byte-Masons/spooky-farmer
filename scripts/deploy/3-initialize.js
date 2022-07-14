async function main() {
  const vaultAddress = '0x1789FF5d356F3961f710ffE93f548AcdF90388b6';
  const strategyAddress = '0xC706d0851b6534F946466cCD8279e62F15C46a73';

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
