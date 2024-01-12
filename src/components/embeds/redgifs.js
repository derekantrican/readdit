import { useEffect, useState } from "react";

let token = null;

function RedGifsPlayer(props) {
  //Todo: I would prefer to get the direct link. Looks like I can do that by getting a temporary token, then calling the API: 
  // https://github.com/yt-dlp/yt-dlp/blob/0b6f829b1dfda15d3c1d7d1fbe4ea6102c26dd24/yt_dlp/extractor/redgifs.py#L68

  useEffect(() => {
    async function getDirectLink() {
      if (!token) {
        const response = await fetch('https://api.redgifs.com/v2/auth/temporary');
        const responseJson = await response.json();
        token = responseJson.token;
      }

      //Todo: fetch the direct link
    }

    getDirectLink();
  }, []);

  const parseRedGifsId = (url) => {
    var regExp = /redgifs\.com\/watch\/(\w*)/;
    var match = url.match(regExp);
    return match && match[1];
  }
  
  return (
    <iframe style={{height: props.sizeRatio * (window.screen.width - 30), width: '100%', marginTop: 10}} allowFullScreen sandbox src={`https://redgifs.com/ifr/${parseRedGifsId(props.url)}`}/>
  );
}

export default RedGifsPlayer;