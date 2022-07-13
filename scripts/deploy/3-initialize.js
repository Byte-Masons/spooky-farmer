async function main() {
  const vaultAddress = '0xc749229D5A058Fbd06F57dA69ebA09C7CB8Bf0E7';
  const strategyAddress = '0x802Da78e8FAaF5f96b51A7063fB0bCE4dd85a9b0';

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
