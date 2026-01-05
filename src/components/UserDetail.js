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

function UserDetail(props) {
  const [viewType, setViewType] = useState('posts');

  return (
    <div style={{display: 'flex', flexDirection: 'column', padding: 10}}>
      <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: '2px solid gray', paddingBottom: 10}}>
        <div style={{flex: '1 0 0'}}>
          <h2 style={{margin: 0}}>u/{props.username}</h2>
          {props.aboutData?.data && (
            <div style={{fontSize: '14px', color: '#aaa', marginTop: 5}}>
              {props.aboutData.data.link_karma?.toLocaleString() ?? 0} post karma • {props.aboutData.data.comment_karma?.toLocaleString() ?? 0} comment karma
            </div>
          )}
        </div>
        <i style={{height: 30, width: 30, fontSize: '25px', marginLeft: 10}} className='bi bi-x-lg' onClick={() => props.close()}/>
      </div>
      
      <div style={{marginTop: 10}}>
        <div style={{display: 'flex', gap: 10, marginBottom: 10}}>
          <button 
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: viewType === 'posts' ? '#007bff' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
            onClick={() => setViewType('posts')}
          >
            Posts
          </button>
          <button 
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: viewType === 'comments' ? '#007bff' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
            onClick={() => setViewType('comments')}
          >
            Comments
          </button>
        </div>

        {viewType === 'comments' && props.data?.data?.children?.filter(c => c.kind === 't1').map(comment => (
          <div key={comment.data.id} style={{
            border: '2px solid gray',
            borderRadius: 5,
            padding: 10,
            marginBottom: 10,
            backgroundColor: '#3f3f3f'
          }}>
            <div style={{fontSize: '12px', color: '#aaa', marginBottom: 5}}>
              in {comment.data.subreddit_name_prefixed}
            </div>
            <div style={{overflowWrap: 'anywhere'}}>
              <Markdown remarkPlugins={[remarkGfm, remarkRedditSuperscript]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents}>
                {comment.data.body}
              </Markdown>
            </div>
            <div style={{fontSize: '11px', color: '#999', marginTop: 5}}>
              {comment.data.score} points
            </div>
          </div>
        )) || (!props.data && viewType === 'comments' && <div style={{color: '#999', marginTop: 20}}>Loading comments...</div>)}

        {viewType === 'posts' && props.data?.data?.children?.map(item => {
          // Handle both t3 (link) posts
          if (item.kind === 't3') {
            const post = item.data;
            return (
              <div key={post.id} style={{
                border: '2px solid gray',
                borderRadius: 5,
                padding: 10,
                marginBottom: 10,
                backgroundColor: '#3f3f3f',
                cursor: 'pointer'
              }}
              onClick={() => props.openPost(post.permalink)}
              >
                <div style={{fontWeight: 'bold', marginBottom: 5}}>
                  {post.title}
                </div>
                <div style={{fontSize: '12px', color: '#aaa', marginBottom: 5}}>
                  in {post.subreddit_name_prefixed}
                </div>
                <EmbedContainer post={post}/>
                {post.selftext && (
                  <div style={{fontSize: '14px', color: '#ccc', marginBottom: 5, maxHeight: '100px', overflow: 'hidden'}}>
                    {post.selftext.substring(0, 200)}...
                  </div>
                )}
                <div style={{fontSize: '11px', color: '#999', marginTop: 5}}>
                  {post.score} points • {post.num_comments} comments
                </div>
              </div>
            );
          }
          return null;
        }) || (!props.data && viewType === 'posts' && <div style={{color: '#999', marginTop: 20}}>Loading posts...</div>)}
      </div>
    </div>
  );
}

export default UserDetail;
