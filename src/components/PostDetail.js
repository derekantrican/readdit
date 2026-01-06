import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Needed to allow HTML from our custom remarkRedditSuperscript plugin to render instead of being escaped
import remarkRedditSuperscript from '../utils/remarkRedditSuperscript';
import EmbedContainer from './embeds/EmbedContainer';
import { storage } from '../utils/settingsManager';
import { baseUrl } from '../utils/config';

const MarkdownComponents = {
  a: ({node, ...props}) => {
    // Rewrite reddit.com links to use baseUrl to keep navigation within the app
    if (props.href && props.href.includes('reddit.com')) {
      const match = /reddit\.com(\/.*)/.exec(props.href);
      if (match) {
        props.href = baseUrl() + match[1];
      }
    }
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  }
};

function PostDetail(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', padding: 10}}>
      <PostDetailHeader data={props.data[0].data.children[0].data /*The 'post data' section*/} close={props.close} openUser={props.openUser}/>

      <EmbedContainer post={props.data[0].data.children[0].data}/>{/*Sometimes, the postListing data has an image and the postDetail does not - so the image goes away when the comments load*/}
      {/*Todo: make this full width*/}
      {/*Todo: on the post comments page, we shouldn't be embedding ALL content (eg news site preview images)*/}
      {props.data.length > 1
        ? <PostDetailComments data={props.data[1].data.children /*The 'comments' section*/} openUser={props.openUser}/>
        : <div className="progress-bar" style={{marginTop: 5}}>{/*Show progress bar until comments are loaded*/}
            <div className="progress-bar-value"/>
          </div>
      }
      {/*Todo: should comments scroll while leaving the header in place?*/}
      
    </div>
  );
}
  
function PostDetailHeader(props) {
    //Todo: show images (& galleries - eg functionalprint), embeds (eg videos), etc
    const showUsernames = storage.getSettings().showUsernames ?? true;
  
    return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
            <div>{props.data.score}</div>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-down-fill'/>
        </div>
        <div style={{margin: 10, display: 'flex', flexDirection: 'column'}}>
          <div style={{fontWeight: 'bold'}}>{props.data.title}</div>
          {showUsernames && 
            <div 
              style={{fontSize: '12px', color: '#aaa', marginTop: 3, cursor: 'pointer', textDecoration: 'underline'}}
              onClick={() => props.openUser(props.data.author)}
            >
              u/{props.data.author}
            </div>
          }
        </div>
        <div style={{flex: '1 0 0'}}/>{/*Fill available space so close button is always at the far right*/}
        <i style={{height: 30, width: 30, fontSize: '25px', marginLeft: 10}} className='bi bi-x-lg' onClick={() => props.close()}/>
        </div>
        {props.data.selftext ?
          <div style={{overflowWrap: 'anywhere'}}>
            <Markdown remarkPlugins={[remarkGfm, remarkRedditSuperscript]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents}>{props.data.selftext}</Markdown>
          </div>
        : null}
    </div>
    );
}
  
function PostDetailComments(props) {
  const hidePinnedComments = storage.getSettings().hidePinnedComments ?? false;
  
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {props.data
        .filter(c => c.kind == 't1' /*filter out other kinds (eg 'more')*/)
        .filter(c => !(hidePinnedComments && c.data.stickied))
        .map(c =>
        <Comment key={c.data.id} comment={c} openUser={props.openUser}/>
        //Todo: handle the 'more' comment at the end?
      )}
    </div>
  );
}

function Comment(props) {
  const [areRepliesExpanded, setAreRepliesExpanded] = useState(false);
  const showUsernames = storage.getSettings().showUsernames ?? true;

  const levelsAsArray = props.level ? Array.from(Array(props.level).keys()) : [];

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <div key={props.comment.id} style={{display: 'flex', flexDirection: 'row', borderWidth: '2px 0px 0px 0px', borderStyle: 'solid', borderColor: 'gray', padding: '5px 5px 5px 0px'}}>
        {levelsAsArray.map(l =>
          <div style={{borderLeft: '2px solid gray', marginRight: 5}}/>
        )}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
          <div>{props.comment.data.score}</div>
          <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-down-fill'/>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', width: '100%', marginLeft: 10, overflowWrap: 'anywhere'}}>
          <Markdown remarkPlugins={[remarkGfm, remarkRedditSuperscript]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents}>{props.comment.data.body}</Markdown>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 3}}>
            {showUsernames && 
              <div 
                style={{fontSize: '11px', color: '#999', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={() => props.openUser(props.comment.data.author)}
              >
                u/{props.comment.data.author}
              </div>
            }
            <div style={{flex: '1 0 0'}}/>{/*Spacer to push button to the right*/}
            {props.comment.data.replies && 
              props.comment.data.replies.data.children[0].kind != 'more' //Todo: there *are* more comments here, but we can't currently handle them. So this will hide the "Replies" button for now
              ? <button style={{width: 80}} onClick={() => setAreRepliesExpanded(!areRepliesExpanded)}>Replies</button>
              : null
            }
          </div>
        </div>
      </div>
      {/*Todo: see if I can de-dupe this code with 'PostDetailComments' above*/}
      {areRepliesExpanded 
        ? props.comment.data.replies.data.children.filter(c => c.kind == 't1' /*filter out other kinds (eg 'more')*/).map(c => 
          <Comment key={c.id} comment={c} level={(props.level ?? 0) + 1} openUser={props.openUser}/>
        ) : null
      }
    </div>
  );
}

export default PostDetail;