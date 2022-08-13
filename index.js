const fetch = require('node-fetch')
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');
const fs = require('fs');
const db = require('better-replit-db');

const { TwitterApi } = require('twitter-api-v2');

const stops = JSON.parse(fs.readFileSync('stops.json', { encoding: 'utf-8', flag: 'r' }));

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const oauth_token = process.env.OAUTH_KEY;
const oauth_token_secret = process.env.OAUTH_SECRET;

const userClient = new TwitterApi({
  appKey: consumer_key,
  appSecret: consumer_secret,
  // Following access tokens are not required if you are
  // at part 1 of user-auth process (ask for a request token)
  // or if you want a app-only client (see below)
  accessToken: oauth_token,
  accessSecret: oauth_token_secret,
});

const google_key = process.env.GOOGLE_KEY;

const endpointURL = 'https://api.twitter.com/2/tweets';
const uploadURL = 'https://upload.twitter.com/1.1/media/upload.json?media_category=tweet_image';

// this example uses PIN-based OAuth to authorize the user
const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const oauth = OAuth({
  consumer: {
    key: consumer_key,
    secret: consumer_secret
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

async function getRequest(station, {
  oauth_token,
  oauth_token_secret
}) {

  const token = {
    key: oauth_token,
    secret: oauth_token_secret
  };

  const authHeader = oauth.toHeader(oauth.authorize({
    url: endpointURL,
    method: 'POST'
  }, token));

  console.log('getting image')
  const imageReq = await fetch(`https://maps.googleapis.com/maps/api/streetview?size=1080x1080&location=${station.stop_lat},${station.stop_lon}&fov=50&pitch=0&key=${google_key}`)
  const arrayBuffer = await imageReq.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log('uploading image')
  const mediaId = await userClient.v1.uploadMedia(buffer, { mimeType: 'image/png' });
  console.log(mediaId)

  const tweetContent = {
    text: `${station.stop_name} (${station.stop_lat},${station.stop_lon})`,
    media: {
      media_ids: [
        mediaId
      ]
    }
  }

  console.log('tweeting')

  const { data: createdTweet } = await userClient.v2.tweet(tweetContent);
  console.log('Tweet', createdTweet.id, ':', createdTweet.text);

  return;
}

setInterval(async () => {
  const now = new Date().valueOf();
  const lastRaw = await db.get('lastposted');
  const last = new Date(lastRaw).valueOf();

  console.log(now)
  console.log(last)

  //30 minutes
  if (now > last + (1000 * 60 * 30)) {
    let trainStations = await db.get('stations');
    let busStops = await db.get('stops');

    if (trainStations.length > 0) {
      const station = stops[trainStations.shift()]
      db.set('stations', trainStations)

      getRequest(station, {
        oauth_token: oauth_token,
        oauth_token_secret: oauth_token_secret
      })

      db.set('lastposted', now);
    } else if (busStops.length > 0) {
      const station = stops[busStops.shift()]
      db.set('stops', busStops)

      getRequest(station, {
        oauth_token: oauth_token,
        oauth_token_secret: oauth_token_secret
      })

      db.set('lastposted', now);
    } else {
      process.exit(1);
    }
  }

  console.log('checking')

}, 1000 * 15)