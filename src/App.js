import './App.css';
import { useEffect, useState } from 'react';
import PostListing from './PostListing';
import PostDetail from './PostDetail';

function App() {
  const [view, setView] = useState('posts');
  const cache = {}; //Todo: I don't think this is quite working

  const [sourceString, setSourceString] = useState(null);
  const [posts, setPosts] = useState([]);
  const [nextToken, setNextToken] = useState(null);

  const [postData, setPostData] = useState(null);

  useEffect(() => {
    var subMatch = /\/(r\/\w+|u(ser)?\/\w+\/m\/\w+)/.exec(window.location.pathname);
    if (subMatch) {
      setSourceString(subMatch[0].replace('/u/', '/user/'));
    }
    else if (localStorage.getItem('source')) {
      setSourceString(localStorage.getItem('source'));
    }
    else {
      setSourceString('/r/all');
    }
  }, []);

  useEffect(() => {
    async function getPosts() {
      if (sourceString) {
        const url = `https://www.reddit.com${sourceString}/.json?limit=${process.env.NODE_ENV != 'production' ? 30 : 100}&raw_json=1`;
        if (!cache[url]) {
          const response = await fetch(url);
          const data = await response.json();
          // console.log(data.data.children.map(p => p.data));
          cache[url] = data.data.children.map(p => p.data);
        }

        setPosts(cache[url]);
        // setNextToken(data.data.after); //Todo: user next token
      }
    }
    
    getPosts();
  }, [sourceString]);

  useEffect(() => {
    async function getPostData() {
      setPostData(null);
      if (view != 'posts') {
        const url = `https://www.reddit.com/comments/${view}/.json?raw_json=1`;
        if (!cache[url]) {
          const response = await fetch(url);
          const data = await response.json();
          // console.log(data);
          cache[url] = data;
        }

        setPostData(cache[url]);
      }
    }

    getPostData();
  }, [view]);

  return (
    <div>
      {/*Todo: fix scroll resetting when changing views*/}
      <div style={{display: view == 'posts' ? 'block' : 'none'}}>
        {posts.map(p => 
          <PostListing key={p.id} post={p} openPost={() => setView(p.id)}/>
        )}
        {/* *Could* have a "Load More" that uses nextToken (but 100 posts is probably enough for me)*/}
      </div>
      <div style={{display: view != 'posts' ? 'block' : 'none'}}>
        {postData ? <PostDetail data={postData} close={() => setView('posts')}/> : null}
      </div>
    </div>
  );
}

export default App;
