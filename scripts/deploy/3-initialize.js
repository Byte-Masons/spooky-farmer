async function main() {
  const vaultAddress = '0x7e81E169213D0CA90041576754511e262a0f273a';
  const strategyAddress = '0x7dc69623163D4DDFCaB7c36700159bBf052eA6fa';

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
