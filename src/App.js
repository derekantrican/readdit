import './App.css';
import { useEffect, useState } from 'react';
import PostListing from './PostListing';
import PostDetail from './PostDetail';

const cache = {};

function App() {
  const [lastSourceString, setLastSourceString] = useState(null);
  const [sourceString, setSourceString] = useState(null);
  const [posts, setPosts] = useState([]);
  const [nextToken, setNextToken] = useState(null);

  const [postData, setPostData] = useState(null);

  const baseUrl = () => process.env.NODE_ENV != 'production' ? 'http://localhost:3000' : 'https://readdit.app';

  useEffect(() => {
    var allowedSourceMatch = /\/(r\/\w+(\/comments\/\w+)?|u(ser)?\/\w+\/m\/\w+|comments\/\w+)/.exec(window.location.pathname);
    if (allowedSourceMatch) {
      setSourceString(allowedSourceMatch[0].replace('/u/', '/user/'));
    }
    else if (localStorage.getItem('source')) {
      setSourceString(localStorage.getItem('source'));
    }
    else {
      setSourceString('/r/all');
    }
  }, []);

  const getRedditData = async (requestPath) => {
    const url = `https://www.reddit.com${requestPath}/.json?limit=${process.env.NODE_ENV != 'production' ? 30 : 100}&raw_json=1`;
    if (!cache[url]) {
      const response = await fetch(url);
      const data = await response.json();
      // console.log(data);
      cache[url] = data;
    }
  
    return cache[url];
  }

  useEffect(() => {
    async function getPosts() {
      if (sourceString) {
        const data = await getRedditData(sourceString);
        if (sourceString.includes('/comments/')) {
          setPostData(data);
        }
        else {
          setPosts(data.data.children.map(p => p.data));
        }
        // setNextToken(data.data.after); //Todo: user next token
      }
    }
    
    getPosts();
  }, [sourceString]);

  return (
    <div>
      {sourceString && !sourceString.includes('/comments/')
        ? posts.map(p => 
          <PostListing key={p.id} post={p} openPost={() => {
            setLastSourceString(sourceString);
            setSourceString(p.permalink);
          }}/>
        )
        //*Could* have a "Load More" that uses nextToken (but 100 posts is probably enough for me)
        : postData ? <PostDetail data={postData} close={() => setSourceString(lastSourceString)}/> : null
      }
    </div>
  );
}

export default App;
