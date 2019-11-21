'use strict';
const dotenv = require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');
const https = require('https');
const fs = require('fs');
const ngrok = require('ngrok'); //test urls for localhost

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

// base URL for webhook server
let baseURL = process.env.BASE_URL;

// listen on port
const port = process.env.PORT || 3000;

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

app.get('/', function (req, res) {
    res.send('hello world')
})
  
//webhook server
https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
    }, app)
.listen(port, function () {
    if (baseURL) {
        console.log(`listening on ${baseURL}/callback`);
    } else {
        console.log("It seems that BASE_URL is not set. Connecting to ngrok...")
        ngrok.connect(port, (err, url) => {
            if (err) throw err;

        baseURL = url;
        console.log(`listening on ${baseURL}/callback`);
    });
    }
})

app.get('/callback', (req, res) => res.end(`I'm listening. Please access with POST.`));

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result).status(200))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
    console.log(event)
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }

    // create a echoing text message
    const echo = { type: 'text', text: event.message.text };

    // use reply API
    return client.replyMessage(event.replyToken, echo);
}

