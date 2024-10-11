import ImageGallery from "./ImageGallery";
import RedditVideoPlayer from "./reddit-video";
import RedGifsPlayer from "./redgifs";

function EmbedContainer(props) {
  const sizeRatio = props.post.thumbnail_height / props.post.thumbnail_width;
  const height = sizeRatio * (window.screen.width - 30);

  //Todo:
  // - gfycat embed
  // - v.redd.it (reddit video) embed 

  //This has a number of "converters" and might be interesting: https://github.com/ubershmekel/redditp/blob/3641c615abd3fe56f6d8f9332696cfec2777026f/js/EmbedIt.js
  const getImage = () => {
    if (props.post.url.includes('.gif')) { //A gif can also have .preview.images so this should be listed first
      return props.post.url;
    }
    else if (props.post.preview?.images) {
      return props.post.preview.images[0].source.url;
    }
    else if (props.post.thumbnail && props.post.thumbnail != "default") {
      return props.post.thumbnail;
    }
  }

  const parseYouTubeId = (url) => {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length==11)? match[7] : false;
  }

  if (!props.post.is_self) { //Todo: break out these "embeds" to separate files
    if (props.post.is_video && props.post.media?.reddit_video) {
      //https://old.reddit.com/r/redditdev/comments/hssi63/how_to_embed_external_and_hosted_reddit/fych52h/
      //https://github.com/junipf/reddit-frontend/blob/master/src/components/reddit-video.jsx
      return (
        <RedditVideoPlayer height={height} id={props.post.id} sourceUrl={props.post.media.reddit_video.fallback_url}/>
      )
    }
    else if (props.post.url.includes('.gifv') || props.post.is_video) {
      return (
        <video height='100%' width='100%' loop controls style={{marginTop: 10}}>
          <source src={props.post.url.replace('.gifv', '.mp4')}/>
        </video>
      );
    }
    else if (props.post.url.includes('youtube') || props.post.url.includes('youtu.be')) {
      return (
        <iframe height={height} width='100%' style={{marginTop: 10}} allowFullScreen src={`https://www.youtube.com/embed/${parseYouTubeId(props.post.url)}`}/>
      );
    }
    else if (props.post.url.includes('redgifs') && !props.post.url.includes('i.redgifs.com') /*Allow static images to be handled as any other static image*/) {
      return (
        <RedGifsPlayer height={height} url={props.post.url}/>
      );
    }
    else if (props.post.is_gallery) {
      return (
        <ImageGallery post={props.post}/>
      );
    }
    else {
      var imageSource = getImage();
      return (
        imageSource ? <img height='100%' width='100%' style={{marginTop: 10}} src={imageSource}/> : null
      );
    }
  }

  return null;
}

export default EmbedContainer;