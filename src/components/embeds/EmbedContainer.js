import ImageGallery from "./ImageGallery";
import RedditVideoPlayer from "./reddit-video";
import RedGifsPlayer from "./redgifs";

function EmbedContainer(props) {
  // For crossposts, use the original post's data
  const post = props.post.crosspost_parent_list?.[0] ?? props.post;
  
  const sizeRatio = post.thumbnail_height / post.thumbnail_width;
  const height = sizeRatio * (window.screen.width - 30);

  //Todo:
  // - gfycat embed
  // - v.redd.it (reddit video) embed 

  //This has a number of "converters" and might be interesting: https://github.com/ubershmekel/redditp/blob/3641c615abd3fe56f6d8f9332696cfec2777026f/js/EmbedIt.js
  const getImage = () => {
    if (post.url.includes('.gif')) { //A gif can also have .preview.images so this should be listed first
      return post.url;
    }
    else if (post.preview?.images) {
      return post.preview.images[0].source.url;
    }
    else if (post.thumbnail && post.thumbnail != "default") {
      return post.thumbnail;
    }
  }

  const parseYouTubeId = (url) => {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length==11)? match[7] : false;
  }

  if (!post.is_self) { //Todo: break out these "embeds" to separate files
    if (post.is_video && post.media?.reddit_video) {
      //https://old.reddit.com/r/redditdev/comments/hssi63/how_to_embed_external_and_hosted_reddit/fych52h/
      //https://github.com/junipf/reddit-frontend/blob/master/src/components/reddit-video.jsx
      return (
        <RedditVideoPlayer height={height} id={post.id} sourceUrl={post.media.reddit_video.fallback_url}/>
      )
    }
    else if (post.url.includes('.gifv') || post.is_video) {
      return (
        <video height='100%' width='100%' loop controls style={{marginTop: 10}}>
          <source src={post.url.replace('.gifv', '.mp4')}/>
        </video>
      );
    }
    else if (post.url.includes('youtube') || post.url.includes('youtu.be')) {
      return (
        <iframe height={height} width='100%' style={{marginTop: 10}} allowFullScreen src={`https://www.youtube.com/embed/${parseYouTubeId(post.url)}`}/>
      );
    }
    else if (post.url.includes('redgifs') && !post.url.includes('i.redgifs.com') /*Allow static images to be handled as any other static image*/) {
      return (
        <RedGifsPlayer height={height} url={post.url}/>
      );
    }
    else if (post.is_gallery) {
      return (
        <ImageGallery post={post}/>
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