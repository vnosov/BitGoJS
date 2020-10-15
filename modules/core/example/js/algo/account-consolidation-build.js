/**
 * Account consolidations are run for Algorand currently, where you need to sweep money
 * off receive addresses into the main wallet. This is the only way to get money off
 * receive addresses.
 *
 * USAGE: This is used for where some intermediate verification/validation of the
 * consolidation tx needs to occur.
 */
const BitGoJS = require('bitgo');
const Promise = require('bluebird');

// change this to env: 'production' when you are ready for production
const bitgo = new BitGoJS.BitGo({ env: 'test' });

// change this to 'algo' when you are ready for production
const coin = 'talgo';

// this can be found on test.bitgo.com in the URL after clicking on a wallet
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = 'your wallet id';

// this is your wallet passphrase, which could be different than your login credentials
const walletPassphrase = 'set your wallet passphrase here';

// this will need to be a real OTP code on production
const otp = '000000';

// this can be retrieved by logging into app.bitgo-test.com (app.bitgo.com for production)
// and going to: User > User Settings > Access Tokens > (+ icon)
// the token will need Spender permission for ALGO
const accessToken = 'insert access token string here';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  // this is your wallet's root address - this is where spendable funds come from
  console.log('Root Address:', wallet.coinSpecific().rootAddress);

  // your balance or confirmed balance will be sum of the amounts
  // across all addresses and your wallet's root address
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());

  // your spendable balance will be the balance on the wallet root address
  // and should differ from your confirmed balance
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  // we have to unlock this session since we're sending funds
  const unlock = yield bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }

  // example of passing specific addresses
  // const buildParams = { consolidateAddresses: ['X6VKIZG5RLZNCIMYXQAHM7G7DM5P65UQJRI7M74ZWYIPSY4CXFNTK3DCIE'] };

  // these are the transactions that will get built and signed locally
  // - there is an optional consolidateAddresses parameter here - if you want to pass specific
  // addresses, pass buildParams above instead of ()
  const consolidationTxes = yield wallet.buildAccountConsolidations();

  // this will take all money off receive addresses in the wallet
  // you can also specify which receive address by passing consolidateAddresses here:
  // e.g. { walletPassphrase, ΩΩΩ: ['onchainReceiveAddress'] }

  try {
    // this is one example of how you might send only the first consolidation from this group
    const unsignedConsolidation = consolidationTxes[0];
    const sendConsolidations = yield wallet.sendAccountConsolidation({ walletPassphrase, prebuildTx: unsignedConsolidation });
    console.dir(sendConsolidations, { depth: 6 });
  } catch (e) {
    console.error(e);
  }
})();
