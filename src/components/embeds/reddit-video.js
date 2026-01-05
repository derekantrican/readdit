import { useEffect, useRef, useState } from "react";

function RedditVideoPlayer(props) {
  //Todo: support reddit video gifs

  //https://stackoverflow.com/a/67464583/2246411
  //This *kinda* works for play & pause, but not really at all for seek. Also, the audio isn't truly connected to the video (eg the "mute" control
  //on the video doesn't work). Maybe should find out how to create a "blob" like RES:
  //https://github.dev/honestbleeps/Reddit-Enhancement-Suite/blob/21217ded9dd12f4e998f9e67477191afa92e0c9d/lib/modules/showImages.js
  
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  
  useEffect(() => {
    async function getAudioUrl() {
      if (props.sourceUrl) {
        try {
          //Todo: cache results
          //Parse the audio url from the DASHPlaylist
          // Handle both DASH and CMAF formats: extract base URL by removing the filename and query params
          const baseMediaUrl = props.sourceUrl.replace(/\/(DASH|CMAF).*/, '/');
          const response = await fetch(baseMediaUrl + 'DASHPlaylist.mpd');
          const responseText = await response.text();
          //regex parsing xml definitely isn't the best approach (https://stackoverflow.com/a/702222/2246411), however it's quick and dirty for now
          if (responseText.includes('AudioChannelConfiguration')) { //Some videos don't have audio, so the audio url will be missing
            const match = /(?<=AudioChannelConfiguration).*?<BaseURL>(?<audio_path>.*?)<\/BaseURL>/gms.exec(responseText);
            if (match?.groups?.audio_path) {
              setAudioUrl(baseMediaUrl + match.groups.audio_path);
            }
          }
        } catch (err) {
          console.error('Failed to fetch audio for reddit video:', err);
        }
      }
    }

    getAudioUrl();
  }, [props.sourceUrl]);

  const $video = useRef(null);
  const $audio = useRef(null);

  const play = () => {
    if (audioUrl && audioReady && $audio.current) {
      $audio.current.play().catch(err => console.error('Audio play failed:', err));
    }
  };

  const pause = () => {
    if (audioUrl && $audio.current) {
      $audio.current.pause();
    }
  };

  const seek = () => {
    if (audioUrl && audioReady && $audio.current && $video.current) {
      $audio.current.currentTime = $video.current.currentTime;
    }
  };

  const syncVolume = () => {
    if ($audio.current && $video.current) {
      $audio.current.volume = $video.current.volume;
      $audio.current.muted = $video.current.muted;
    }
  };

  const syncPlaybackRate = () => {
    if ($audio.current && $video.current) {
      $audio.current.playbackRate = $video.current.playbackRate;
    }
  };

  return (
    <>
      <video 
        height={props.height} 
        width='100%' 
        ref={$video} 
        controls 
        src={props.sourceUrl}
        onPlay={play} 
        onPause={pause} 
        onSeeking={seek}
        onSeeked={seek}
        onVolumeChange={syncVolume}
        onRateChange={syncPlaybackRate}
      />
      {audioUrl && (
        <audio 
          ref={$audio} 
          src={audioUrl}
          onCanPlay={() => setAudioReady(true)}
          style={{display: 'none'}}
        />
      )}
    </>
  );
}

export default RedditVideoPlayer;