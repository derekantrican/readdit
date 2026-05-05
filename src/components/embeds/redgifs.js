import { useEffect, useRef, useState } from "react";

let tokenPromise = null;
function getRedGifsToken() {
  if (!tokenPromise) {
    tokenPromise = fetch('https://api.redgifs.com/v2/auth/temporary')
      .then(res => res.json())
      .then(data => data.token)
      .catch(err => {
        tokenPromise = null; // Allow retry on failure
        throw err;
      });
  }
  
  return tokenPromise;
}

function RedGifsPlayer(props) {
  const parseRedGifsId = (url) => {
    var regExp = /redgifs\.com\/(watch|ifr)\/(\w*)/;
    var match = url.match(regExp);
    return match && match[2];
  }

  const ref = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    async function fetchVideoUrl() {
      const id = parseRedGifsId(props.url);
      if (!id) 
        return;

      try {
        const token = await getRedGifsToken();

        // Fetch the gif details using the API (id must be lowercase)
        const gifResponse = await fetch(`https://api.redgifs.com/v2/gifs/${id.toLowerCase()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const gifData = await gifResponse.json();
        setVideoUrl(gifData.gif?.urls?.hd || gifData.gif?.urls?.sd);
      } 
      catch (err) {
        console.error('Failed to fetch RedGifs video URL:', err);
      }
    }

    if (!videoUrl) {
      fetchVideoUrl();
    }
  }, [props.url, videoUrl]);

  return (
    <video ref={ref} height={props.height} width="100%" style={{marginTop: 10}} controls loop>
      {videoUrl && <source src={videoUrl} type="video/mp4" />}
    </video>
  );
}

export default RedGifsPlayer;