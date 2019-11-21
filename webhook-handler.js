const Bluebird = require('bluebird');
const crypto = require('crypto');
const request = require('request-promise');

const invalidEventProcessor = require('./event-processors/invalid');
const joinEventProcessor = require('./event-processors/join');
const leaveEventProcessor = require('./event-processors/leave');
const messageEventProcessor = require('./event-processors/message');

const MAX_CONCURRENCY = 5;

const REPLY = {
  URL: 'https://api.line.me/v2/bot/message/reply',
  TIMEOUT: 60000, // 60 seconds
};

const processEventByType = (event) => {
  switch (event.type) {

    case 'join':
      return joinEventProcessor(event);

    case 'leave':
      return leaveEventProcessor(event);

    case 'message':
      return messageEventProcessor(event);

    default:
      return invalidEventProcessor();
  }
};

const processEvent = event => processEventByType(event)
  .catch((err) => {
    console.error(err);

    // In case something error on our side,
    // we should tell the user that we're unable to process the request
    const messages = [{
      type: 'text',
      text: 'Something error',
    }];

    return messages;
  })
  .then((messages) => {
    // Some events don't have replyToken
    if (!event.replyToken) {
      return Bluebird.resolve();
    }

    const requestBody = {
      replyToken: event.replyToken,
      messages,
    };

    const requestOptions = {
      uri: REPLY.URL,
      method: 'POST',
      timeout: REPLY.TIMEOUT,
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      resolveWithFullResponse: true,
    };

    return request(requestOptions)
      .then((response) => {
        if (response.statusCode === 200) {
          console.log('Reply sent successfully');
        } else {
          console.log(`Error sending reply to LINE server with status ${response.statusCode}:\n ${response.body}`);
        }
      });
  })
  .catch((err) => {
    // Error sending HTTP request
    console.error(err);
  });

const processWebhookEvents = events => Bluebird.map(events, event => processEvent(event), { concurrency: MAX_CONCURRENCY });

module.exports = (req, res) => {
  try {
    const text = JSON.stringify(req.body);
    // const hmac = crypto.createHmac('SHA256', process.env.LINE_CHANNEL_SECRET).update(text).digest('raw');
    // const signature = Buffer.from(hmac).toString('base64');
    const signature = crypto.createHmac('SHA256', process.env.LINE_CHANNEL_SECRET).update(text).digest('base64').toString();

    if (signature !== req.headers['x-line-signature']) {
      return res.status(401).send('Unauthorized');
    }

    return processWebhookEvents(req.body.events)
      .then(() => res.status(200).send('OK'));
  } catch (err) {
    console.error(err);

    return res.status(500).send('Error');
  }
};