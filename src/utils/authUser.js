//https://github.com/reddit-archive/reddit/wiki/OAuth2#authorization

import { LocalStorageSources, saveSources } from "./sourcesManager";

const CLIENT_ID = 'CeueGcQLdD2k4AGoB_K5_w';
const SCOPES = [
  'identity', //Needed to get username (for saves)
  'history', //Needed to get saves (using username)
  'mysubreddits', //Needed to get subscribed subs
];

export function generateAuthUrl() {
  return 'https://www.reddit.com/api/v1/authorize.compact?' +
    `client_id=${CLIENT_ID}` +
    '&response_type=code' +
    `&state=${crypto.randomUUID().replace('-', '')}` + //A GUID-like string should be "random enough"
    '&redirect_uri=https://readdit.app/auth' +
    '&duration=permanent' +
    `&scope=${SCOPES.join('%20')}`;
}

export async function authUser(authQuery) {
  const params = new URLSearchParams(authQuery);

  if (params.get('error')) {
    alert(`Unable to authorize:\n\n${params.get('error')}`);
    return;
  }

  var requestBody = new FormData();
  requestBody.append("grant_type", "authorization_code");
  requestBody.append("code", params.get('code'));
  requestBody.append("redirect_uri", "https://readdit.app/auth");

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: "Basic " + btoa(`${CLIENT_ID}:`),
    },
    body: requestBody,
  });

  if (response.ok) {
    const data = await response.json();
    
    if (data.access_token) {
      //Get user subs
      const subResponse = await fetch('https://oauth.reddit.com/subreddits/mine/subscriber', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        }
      });
      if (subResponse.ok) {
        //Todo: doing it this way means that if the user subscribes to a new sub, it won't be updated here
        LocalStorageSources.push({
          sourceString : `/r/${(await subResponse.json()).data.children.map(s => s.data.display_name).join('+')}`,
          selected : LocalStorageSources.length == 0, //Select the source by default if it is the only one
          id : crypto.randomUUID(),
        });
      }

      //Get user saves
      const meResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        }
      });

      if (meResponse.ok) {
        const username = (await meResponse.json()).name;
        LocalStorageSources.push({
          title : `${username}'s Saves`,
          sourceString : `https://oauth.reddit.com/user/${username}/saved.json?limit=100&raw_json=1`, //We'll just save the url needed for the request and use it directly
          access_token : data.access_token,
          refresh_token : data.refresh_token,
          expiration_date : calculateExpiration(data.expires_in),
          selected : false,
          id : crypto.randomUUID(),
        });
      }

      saveSources(); //Todo: this doesn't update the Sidebar listings

      alert('Successfully authorized account with readdit!\n\nCheck the settings panel to switch to your subs or saves');
    }
  }
}

export function calculateExpiration(expires_in) {
  return new Date(new Date().getTime() + expires_in * 1000).toJSON();
}

export async function refreshToken(refresh_token) {
  var requestBody = new FormData();
  requestBody.append("grant_type", "refresh_token");
  requestBody.append("refresh_token", refresh_token);

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: "Basic " + btoa(`${CLIENT_ID}:`),
    },
    body: requestBody,
  });

  if (response.ok) {
    const data = await response.json();

    if (data.access_token) {
      return data;
    }
  }
}