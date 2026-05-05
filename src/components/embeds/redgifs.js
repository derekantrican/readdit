import { useRef } from "react";
import useOnScreen from "../../hooks/useOnScreen";

function RedGifsPlayer(props) {
  const parseRedGifsId = (url) => {
    var regExp = /redgifs\.com\/(watch|ifr)\/(\w*)/;
    var match = url.match(regExp);
    return match && match[2];
  }

  const ref = useRef(null);
  const isVisible = useOnScreen(ref); //Only load iframe when visible
  
  return (
    <iframe ref={ref} height={props.height} width='100%' style={{marginTop: 10}} allowFullScreen sandbox
      src={isVisible ? `https://redgifs.com/ifr/${parseRedGifsId(props.url)}` : null}/>
  );
}

export default RedGifsPlayer;