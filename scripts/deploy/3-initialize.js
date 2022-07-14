async function main() {
  const vaultAddress = '0x23D5b28B7C46798DeAE10E5ffB7e808B3464e02A';
  const strategyAddress = '0x4857331d1d7FFf5d88eEE2e53866135C6882809b';

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
