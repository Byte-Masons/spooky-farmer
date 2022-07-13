async function main() {
  const vaultAddress = '0x19B22482721747Ac005C553b491F6f4F8aAC727C';
  const strategyAddress = '0xFebDb941cd0d1F02c7Df670De24B17e811976242';

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
