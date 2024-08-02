//https://github.com/reddit-archive/reddit/wiki/OAuth2#authorization

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
    console.log(data);
    
    if (data.access_token) {
      //Todo: it might be best if these 'sources functions' (get, add, save, etc) were in a common place
      var currentSources = JSON.parse(localStorage.getItem('sources')) ?? [];
      
      //Get user subs
      const subResponse = await fetch('https://oauth.reddit.com/subreddits/mine/subscriber', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        }
      });
      if (subResponse.ok) {
        //Todo: doing it this way means that if the user subscribes to a new sub, it won't be updated here
        currentSources.push({
          sourceString : `/r/${(await subResponse.json()).data.children.map(s => s.data.display_name).join('+')}`,
          selected : currentSources.length == 0, //Select the source by default if it is the only one
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
        currentSources.push({
          sourceString : `${username}'s Saves`,
          url : `https://oauth.reddit.com/user/${username}/saved`, //We'll just save the url needed for the request and use it directly
          access_token : data.access_token,
          refresh_token : data.refresh_token,
          selected : false,
          id : crypto.randomUUID(),
        });
      }

      localStorage.setItem('sources', JSON.stringify(currentSources)); //Todo: this doesn't update the Sidebar listings

      alert('Successfully authorized account with readdit!\n\nCheck the settings panel to switch to your subs or saves');
    }
  }
}

export async function refreshToken() {
  //Todo https://github.com/reddit-archive/reddit/wiki/OAuth2#refreshing-the-token
}