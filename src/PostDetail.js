import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

//Todo: there's still trouble rendering markdown superscripts. I tried the remark-supersub Markdown plugin, but the syntax it expects
//is not the same as reddit (it expects '^this^` rather than just `^this` where each consecutive ^ increases the "superscript level")

function PostDetail(props) {
    //Todo: There will probably need to be some markdown rendering in the comments (or both)
    //Todo: show images (& galleries), embeds (eg videos), etc
    return (
      <div style={{display: 'flex', flexDirection: 'column', padding: 10}}>
        <PostDetailHeader data={props.data[0].data.children[0].data /*The 'post data' section*/} close={props.close}/>
        <PostDetailComments data={props.data[1].data.children /*The 'comments' section*/}/>
      </div>
    );
}
  
function PostDetailHeader(props) {
    //Todo: right now this is geared toward self posts, but we should be able to support galleries (eg functionalprint), etc
  
    return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
            <div>{props.data.score}</div>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-down-fill'/>
        </div>
        <div style={{margin: 10, fontWeight: 'bold'}}>{props.data.title}</div>
        <div style={{flex: '1 0 0'}}/>{/*Fill available space so close button is always at the far right*/}
        <i style={{height: 30, width: 30, fontSize: '25px', marginLeft: 10}} className='bi bi-x-lg' onClick={() => props.close()}/>
        </div>
        {props.data.selftext ?
          <div style={{overflowWrap: 'anywhere'}}>
            <Markdown remarkPlugins={[remarkGfm]}>{props.data.selftext}</Markdown>
          </div>
        : null}
    </div>
    );
}
  
function PostDetailComments(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {props.data.map(c =>
        <div key={c.id} style={{display: 'flex', flexDirection: 'row', borderWidth: '2px 0px 0px 0px', borderStyle: 'solid', borderColor: 'gray', padding: 5}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
            <div>{c.data.score}</div>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-down-fill'/>
          </div>
          <div style={{marginLeft: 10, overflowWrap: 'anywhere'}}>
            <Markdown remarkPlugins={[remarkGfm]}>{c.data.body}</Markdown>
          </div>
        </div>
        //Todo: Maybe allow expanding comments?
      )}
    </div>
  );
}

export default PostDetail;