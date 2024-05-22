import EmbedContainer from "./embeds/EmbedContainer";

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
        <EmbedContainer post={props.post}/>
        <div style={{display: 'flex', marginTop: 5}}>
          <i style={{fontSize: 20, textAlign: 'center', flex: '1 1 0'}} className='bi bi-share' onClick={() => sharePost(props.post.title, props.post.url)}/>
          <i style={{fontSize: 20, textAlign: 'center', flex: '1 1 0'}} className='bi bi-x-lg' onClick={() => props.hidePost(props.post.id)}/>
          {props.isDevMode ? 
            <a style={{color: 'white', textAlign: 'center', flex: '1 1 0'}} href={`https://github.com/derekantrican/readdit/issues/new?title=Problem+with+post&body=${encodeURIComponent(props.post.permalink)}`}>
              <i style={{fontSize: 20}} className='bi bi-bug'/>
            </a>
          : null}
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

  export default PostListing;