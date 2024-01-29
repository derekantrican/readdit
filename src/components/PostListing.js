import RedditVideoPlayer from "./embeds/reddit-video";
import RedGifsPlayer from "./embeds/redgifs";

function PostListing(props) {
    /* Todo:
    *   - Lazy load images (https://www.npmjs.com/package/react-lazy-load-image-component)
    *   - Allow clicking on images to see full resolution image
    *   - Maybe handle images from cross posts better? (ex https://old.reddit.com/r/functionalprints/comments/18bo7zx/turning_a_standing_lamp_into_a_wall_lamp/)
    */

    const sharePost = (title, url) => {
      //Todo: should have an option to share the comment url rather than the post url
      if (navigator.share) {
        navigator.share({
          title: title,
          url: url
        })
      }
    };
  
    return (
      <div style={{display: 'flex', flexDirection: 'column', padding: 10, border: '2px solid gray', margin: '10px 5px', backgroundColor: '#3f3f3f'}}>
        <PostListingHeader post={props.post}/>
        <PostListingContent post={props.post}/>
        <div style={{display: 'flex', marginTop: 5}}>
          <i style={{fontSize: 20, textAlign: 'center', flex: '1 1 0'}} className='bi bi-share' onClick={() => sharePost(props.post.title, props.post.url)}/>
          <i style={{fontSize: 20, textAlign: 'center', flex: '1 1 0'}} className='bi bi-chat-left-text-fill' onClick={() => props.openPost()}/>
        </div>
      </div>
    );
  }
  
  function PostListingHeader(props) {
    return (
      <div style={{display: 'flex', flexDirection: 'column'}} onClick={() => window.open(props.post.url, "_self")}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <div style={{fontWeight: 'bold', flexGrow: 1}}>{props.post.title}</div>
          {props.post.over_18 ? <div style={{marginLeft: 10, color: 'red'}}>[NSFW]</div> : null}
        </div>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
          <div>{props.post.score}</div>
        </div>
        <div>{props.post.subreddit_name_prefixed}</div>
        <div>{props.post.domain}</div>
      </div>
    );
  }
  
  function PostListingContent(props) {
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
      else if (props.post.gallery_data?.items) {
        return props.post.media_metadata[props.post.gallery_data.items[0].media_id].s.u;
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
      //Todo: handle reddit video
      if (props.post.is_video && props.post.media?.reddit_video) {
        //https://old.reddit.com/r/redditdev/comments/hssi63/how_to_embed_external_and_hosted_reddit/fych52h/
        //https://github.com/junipf/reddit-frontend/blob/master/src/components/reddit-video.jsx
        // return (
        //   <video loop controls style={{width: '100%', height :'100%', marginTop: 10}}>
        //     <source src={props.post.media.reddit_video.fallback_url}/>
        //     <audio src={pr}
        //   </video>
        // );

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
      else {
        return (
          <img height='100%' width='100%' style={{marginTop: 10}} src={getImage()}/>
        );
      }
    }
  
    return null;
  }

  export default PostListing;