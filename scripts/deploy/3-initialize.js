async function main() {
  const vaultAddress = '0x5a7c38c98E3262479bA4ac7433fbf79482BaE314';
  const strategyAddress = '0xe7B63D7Db08fBa119470FdD36cBD196D6C62bcF8';

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
