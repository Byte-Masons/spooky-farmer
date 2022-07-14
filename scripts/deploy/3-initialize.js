async function main() {
  const vaultAddress = '0x8A4C16BD5CD658c860EFb9c74b3AD0DFa50a81CD';
  const strategyAddress = '0x3fBDD1E7368C638Ccbd4ccabFF12Aac071c20dC2';

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
