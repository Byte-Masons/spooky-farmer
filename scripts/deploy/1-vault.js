async function main() {
  const Vault = await ethers.getContractFactory('ReaperVaultv1_4');

  const wantAddress = '0x5965E53aa80a0bcF1CD6dbDd72e6A9b2AA047410';
  const tokenName = 'FTM-fUSDT SpookyV2 Crypt';
  const tokenSymbol = 'rf-FTM-fUSDT-V2';
  const depositFee = 0;
  const tvlCap = ethers.constants.MaxUint256;

  const vault = await Vault.deploy(wantAddress, tokenName, tokenSymbol, depositFee, tvlCap);

  await vault.deployed();
  console.log('Vault deployed to:', vault.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
