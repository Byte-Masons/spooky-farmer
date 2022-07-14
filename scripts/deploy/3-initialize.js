async function main() {
  const vaultAddress = '0xd9C34F7344C32313f6BEDb1cfB434222FFD030cA';
  const strategyAddress = '0x26D27C5851EFb2ce72806955Df141c0C49296a41';

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
