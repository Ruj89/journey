const WebSocket = require('ws');
const { Database } = require('../database/database');

class WSSController {
  lastPrices = [];
  tickers = [];
  miningIndex = 0;

  /**
   * Setup the WebSocket client
   * @param {Database} databaseController Database controller object
   */
  constructor(databaseController) {
    this.databaseController = databaseController;
    this.ws = new WebSocket('wss://ws-feed.pro.coinbase.com');
  }

  /**
   * Connect to the Coinbase ticker channel
   */
  async connect() {
    this.ws.on('open', async () => {
      console.log('Websocket connected');
      this.tickers = (await this.databaseController.getCoins()).map(
        (coin, index) => {
          if (coin.ticker == 'ETH') this.miningIndex = index;
          return coin.ticker + '-EUR';
        }
      );
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          channels: [{ name: 'ticker', product_ids: this.tickers }],
        })
      );
    });

    this.ws.on('close', () => {
      console.log('Websocket disconnected');
    });

    this.ws.on('message', (data) => {
      let responseObject = JSON.parse(data);
      if (responseObject.type == 'ticker') {
        this.lastPrices[this.tickers.indexOf(responseObject.product_id)] =
          responseObject.price;
      }
    });
  }
}

/**
 * Module exports
 */
module.exports = { WSSController: WSSController };
