import { createContext, useContext, useEffect, useState } from "react";

const RedGifsContext = createContext();

let tokenPromise = null; // Singleton pattern for token fetching

async function fetchToken() {
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    const response = await fetch('https://api.redgifs.com/v2/auth/temporary');
    const responseJson = await response.json();
    return responseJson.token;
  })();

  return tokenPromise;
}

function RedGifsProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetchToken().then(setToken);
  }, []);

  return (
    <RedGifsContext.Provider value={token}>
      {children}
    </RedGifsContext.Provider>
  );
}

function useRedGifsToken() {
  return useContext(RedGifsContext);
}

export function RedGifsWrapper({ children }) {
  return (
    <RedGifsProvider>
      {children}
    </RedGifsProvider>
  );
}

export function RedGifsPlayer(props) {
  const token = useRedGifsToken();

  const [directLink, setDirectLink] = useState(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    async function getDirectLink() {
      const id = parseRedGifsId(props.url)
      if (id == null) {
        console.log(`Unable to parse id for url ${props.url}`);
        return;
      }

      const response = await fetch(`https://api.redgifs.com/v2/gifs/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });

      const responseJson = await response.json();
      setDirectLink(responseJson.gif.urls.hd);
      setHeight(responseJson.gif.height * ((window.screen.width - 30) / responseJson.gif.width)); //Set scaled height
    }

    if (token) {
      getDirectLink();
    }
  }, [token]);

  const parseRedGifsId = (url) => {
    var regExp = /redgifs\.com\/(watch|ifr)\/(\w*)/;
    var match = url.match(regExp);
    return match && match[2];
  }

  return (
    <div>
      {token != null
        ? <video height={height} width='100%' src={directLink} controls></video>
        : null
      }
    </div>
  )
}