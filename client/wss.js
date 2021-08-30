const WebSocket = require('ws');
const { Database } = require('../database/database');

class WSSController {
  tickers = {};

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
      this.tickers = (await this.databaseController.getCoins()).reduce(
        (tickers, coin) => {
          if (tickers[coin.ticker] === undefined) {
            tickers[coin.ticker] = {
              coinbaseTicker: `${coin.ticker}-${
                coin.vs === null ? 'EUR' : coin.vs
              }`,
              ids: [coin.id],
              vs: coin.vs,
              value: 0,
            };
          } else tickers[coin.ticker].ids.push(coin.id);
          return tickers;
        },
        []
      );
      let subscriptionObject = {
        type: 'subscribe',
        channels: [
          {
            name: 'ticker',
            product_ids: Object.keys(this.tickers).map(
              (ticker) => this.tickers[ticker].coinbaseTicker
            ),
          },
        ],
      };
      this.ws.send(JSON.stringify(subscriptionObject));
    });

    this.ws.on('close', () => {
      console.log('Websocket disconnected');
    });

    this.ws.on('message', (data) => {
      let responseObject = JSON.parse(data);
      if (responseObject.type == 'ticker') {
        Object.keys(this.tickers).forEach((ticker) => {
          if (
            this.tickers[ticker].coinbaseTicker === responseObject.product_id
          ) {
            this.tickers[ticker].value =
              this.tickers[ticker].vs === null
                ? responseObject.price
                : responseObject.price *
                  this.getValueByTicker(this.tickers[ticker].vs);
          }
        });
      }
    });
  }

  getValueByTicker(ticker) {
    if (this.tickers[ticker] !== undefined) return this.tickers[ticker].value;
    else return 0;
  }

  getValueArray() {
    let valueArray = Object.keys(this.tickers).reduce((valueArray, ticker) => {
      let tickerObject = this.tickers[ticker];
      tickerObject.ids.forEach((id) => {
        valueArray[id] = this.tickers[ticker].value;
      });
      return valueArray;
    }, []);
    return valueArray;
  }
}

/**
 * Module exports
 */
module.exports = { WSSController: WSSController };
