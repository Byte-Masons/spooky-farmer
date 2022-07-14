async function main() {
  const vaultAddress = '0xAbEe29DF1e1Be215f4A10e77b30cEDd218A84654';
  const strategyAddress = '0x8f74886b66c749EaEf5aA083014B46a8175D2DBd';

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
