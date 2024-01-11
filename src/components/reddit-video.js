import { useEffect, useRef, useState } from "react";

function RedditVideoPlayer(props) {
  //Todo: support reddit video gifs

  //https://stackoverflow.com/a/67464583/2246411
  //This *kinda* works for play & pause, but not really at all for seek. Also, the audio isn't truly connected to the video (eg the "mute" control
  //on the video doesn't work). Maybe should find out how to create a "blob" like RES:
  //https://github.dev/honestbleeps/Reddit-Enhancement-Suite/blob/21217ded9dd12f4e998f9e67477191afa92e0c9d/lib/modules/showImages.js
  
  const [audioUrl, setAudioUrl] = useState(null);
  
  useEffect(() => {
    async function getAudioUrl() {
      if (props.sourceUrl) {
        //Todo: cache results
        //Parse the audio url from the DASHPlaylist
        const baseMediaUrl = props.sourceUrl.replace(/(?<=\/)DASH.*/, '');
        const response = await fetch(baseMediaUrl + 'DASHPlaylist.mpd');
        const responseText = await response.text();
        //regex parsing xml definitely isn't the best approach (https://stackoverflow.com/a/702222/2246411), however it's quick and dirty for now
        const { audio_path } = /(?<=AudioChannelConfiguration).*?<BaseURL>(?<audio_path>.*?)<\/BaseURL>/gms.exec(responseText).groups;
        setAudioUrl(baseMediaUrl + audio_path);
      }
    }

    getAudioUrl();
  }, []);

  const $video = useRef(null);
  const $audio = useRef(null);

  const play = () => {
    $audio.current.play();
  };

  const pause = () => {
    $audio.current.pause();
  };

  let lastSeek = null;
  const seek = () => {
    if (lastSeek != $video.current.currentTime) { //Apparently this event gets fired almost continuously, so we'll skip if not needed here
      lastSeek = $video.current.currentTime;
      $audio.current.currentTime = $video.current.currentTime;
    }
  };

  return (
    <video ref={$video} controls src={props.sourceUrl}
      onPlay={play} onPause={pause} onSeeked={seek}>
      <audio ref={$audio} src={audioUrl}/>
    </video>
  );
}

export default RedditVideoPlayer;