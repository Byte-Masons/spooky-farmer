async function main() {
  const vaultAddress = '0x8F264084DdEfB3442359bd175FF602E48B31Ad5f';
  const strategyAddress = '0x312DedFBE8200Ef868F5f76fd6DB4476094DdD76';

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
