async function main() {
  const vaultAddress = '0x48fC619cC9b2C7ef7adabB4f99856a569AabDd09';
  const strategyAddress = '0xB77716242be078858C0FC85bF4aAFF684068b10D';

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
