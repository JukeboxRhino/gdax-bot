/*jshint esversion: 6 */

/*******BEGIN CONFIG*******/
const amountToBuy = 15; //Amount to buy, in dollars;
const apiKey = '';
const apiSecret = '';
const passphrase = '';

//When to buy
const hour = 15; //Remember to use 24 hour time
const minute = 03;
const second = 0;
/********END CONFIG********/

const assert = require('assert');
const Gdax = require('gdax');
let client = new Gdax.AuthenticatedClient(apiKey, apiSecret, passphrase);
let buyTimes = [];

//Set trading pair to ETH-USD
client.productID = 'ETH-USD';

function refreshPrice(callback) {
    client.getProductTicker((err, res, data) => {
        if(!err) {
            callback(null, data.ask);
        } else {
            callback(err);
        }
    });
}

function placeOrder(size) {
    let buyParams = {
        'type': 'market',
        'size': size,
        'side': 'buy',
        'product_id': 'ETH-USD'
    };
    console.log('Placing market order');
    client.buy(buyParams, function(err, res, data) {
        if(!err) {
            console.log('Buy sucessfully placed.');
            console.dir(data);
            queueOrder();
        } else {
            console.log('Error placing buy. Retrying in 60s.');
            return setTimeout(buyEth, 60 * 1000);
        }
    });
}

function buyEth() {
    refreshPrice(function(err, price) {
        if(!err) {
            price = parseFloat(price);
            console.log('-----------------------------------');
            console.log(`Latest ask price is $${price.toFixed(2)} USD/ETH`);
            let size = (amountToBuy / price).toFixed(8);
            console.log(`Buying $${amountToBuy.toFixed(2)} worth of ETH (${size} ETH)`);
            placeOrder(size);
        } else {
            console.log('Error getting price. Retrying in 60s.');
            return setTimeout(buyEth, 60 * 1000);
        }
    });
}

function queueOrder() {
    let now = new Date();
    let timeToBuy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second);
    if(timeToBuy.getTime() < now.getTime()) {
        timeToBuy = new Date(timeToBuy.getTime() + 1000 * 60 * 60 * 24);
    }
    if(buyTimes.indexOf(timeToBuy.getTime()) >= 0) {
        return;
    } else {
        console.log(`Placing next buy order @ ${timeToBuy.toLocaleString()}`);
        setTimeout(buyEth, timeToBuy.getTime() - now.getTime());
        buyTimes.push(timeToBuy.getTime());
    }
}

//Start the timer
queueOrder();