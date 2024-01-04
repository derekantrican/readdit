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
    navigateSource(window.location.pathname);
  }, []);

  const navigateSource = (src) => {
    var allowedSourceMatch = /\/(r\/\w+(\/comments\/\w+)?|u(ser)?\/\w+\/m\/\w+|comments\/\w+)/.exec(src);
    if (allowedSourceMatch) {
      setSourceString(allowedSourceMatch[0].replace('/u/', '/user/'));
    }
    else if (localStorage.getItem('source')) {
      setSourceString(localStorage.getItem('source'));
    }
    else {
      setSourceString('/r/all');
    }
  }

  const getRedditData = async (requestPath) => {
    const url = `https://www.reddit.com${requestPath}/.json?limit=${process.env.NODE_ENV != 'production' ? 30 : 100}&raw_json=1`;
    if (!cache[requestPath]) {
      const response = await fetch(url);
      const data = await response.json();
      // console.log(data);
      cache[requestPath] = {
        data
      };
    }
  
    return cache[requestPath].data;
  }

  useEffect(() => {
    async function getPosts() {
      if (sourceString) {
        setPostData(null); //reset
        window.history.pushState({}, null, baseUrl() + sourceString);

        const data = await getRedditData(sourceString);
        if (sourceString.includes('/comments/')) {
          setPostData(data);
        }
        else {
          setPosts(data.data.children.map(p => p.data));
          window.scrollTo({top: cache[sourceString]?.scrollY ?? 0, left: 0, behavior: 'instant'}); //Restore scroll position
        }
        // setNextToken(data.data.after); //Todo: user next token
      }
    }
    
    getPosts();
  }, [sourceString]);

  const saveScrollPosition = () => {
    if (cache[sourceString]) {
      cache[sourceString].scrollY = window.scrollY;
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition);
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [saveScrollPosition]);

  return (
    <div>
      {sourceString && !sourceString.includes('/comments/')
        ? <div>
            {posts.map(p => 
              <PostListing key={p.id} post={p} openPost={() => {
                setLastSourceString(sourceString);
                navigateSource(p.permalink);
              }}/>
            )}
          {/*Could* have a "Load More" that uses nextToken (but 100 posts is probably enough for me)*/}
          </div>
        : postData ? <PostDetail data={postData} close={() => {
          navigateSource(lastSourceString);
          setLastSourceString(null);
        }}/> : null
      }
    </div>
  );
}

export default App;
