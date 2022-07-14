async function main() {
  const vaultAddress = '0xFc0c07b91AACBe885a2375991Eb32363215fbff3';
  const strategyAddress = '0xbE9D0D57019b04380e3A0a65F67d61bBD4ee5544';

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
