import './App.css';
import { useEffect, useState } from 'react';
import PostListing from './PostListing';
import PostDetail from './PostDetail';

function App() {
  const [view, setView] = useState('posts');
  const cache = {}; //Todo: I don't think this is quite working

  const [subs, setSubs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [nextToken, setNextToken] = useState(null);

  const [postData, setPostData] = useState(null);


  const defaultSubs = [ //Todo: these are *my* default subs, but the default should be changed to "all" or something
    "AskReddit",
    "askscience",
    "climbing",
    "ClimbingPorn",
    "EarthPorn",
    "explainlikeimfive",
    "functionalprint",
    "functionalprints",
    "funny",
    "Futurology",
    "gadgets",
    "homelab",
    "IAmA",
    "minilab",
    "news",
    "personalfinance",
    "science",
    "Showerthoughts",
    "technology",
    "tifu",
    "todayilearned",
    "UpliftingNews",
    "vandwellers",
    "videos",
    "worldnews",
  ];

  useEffect(() => {
    var subMatch = /\/r\/(?<sub>\w+)/.exec(window.location.pathname); //Todo: also support mutlireddits (like /u/<user>/m/<multi>)
    if (subMatch) {
      setSubs(subMatch.groups.sub);
    }
    else {
      setSubs(defaultSubs);
    }
  }, []);

  useEffect(() => {
    async function getPosts() {
      if (subs.length > 0) {
        const url = `https://www.reddit.com/r/${subs.join('+')}/.json?limit=${process.env.NODE_ENV != 'production' ? 30 : 100}&raw_json=1`;
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
  }, [JSON.stringify(subs)]);

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
