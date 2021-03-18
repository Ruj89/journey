const WebSocket = require('ws');

class WSSController {
  lastPrice = 0;

  /**
   * Setup the WebSocket client
   */
  constructor() {
    this.ws = new WebSocket('wss://ws-feed.pro.coinbase.com');
  }

  /**
   * Connect to the ETH-BTC Coinbase channel
   */
  connect() {
    this.ws.on('open', () => {
      console.log('Websocket connected');
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          channels: [{ name: 'ticker', product_ids: ['ETH-EUR'] }],
        })
      );
    });

    this.ws.on('close', () => {
      console.log('Websocket disconnected');
    });

    this.ws.on('message', (data) => {
      let responseObject = JSON.parse(data);
      if (responseObject.type == 'ticker')
        this.lastPrice = responseObject.price;
    });
  }
}

/**
 * Module exports
 */
module.exports = { WSSController: WSSController };
