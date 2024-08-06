import './App.css';
import { useEffect, useState } from 'react';
import PostListing from './components/PostListing';
import PostDetail from './components/PostDetail';
import SideBar from './components/Sidebar';
import { authUser, calculateExpiration, refreshToken } from './utils/authUser';
import { LocalStorageSources, saveSources } from './utils/sourcesManager';

const cache = {};

function App() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [lastSourceString, setLastSourceString] = useState(null);
  const [sourceString, setSourceString] = useState(null);
  const [posts, setPosts] = useState([]);
  const [nextToken, setNextToken] = useState(null);

  const [hiddenPosts, setHiddenPosts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postData, setPostData] = useState(null);

  const [isDevMode, setIsDevMode] = useState(false);

  const baseUrl = () => process.env.NODE_ENV != 'production' ? 'http://localhost:3000' : 'https://readdit.app';

  useEffect(() => {
    if (window.location.pathname.endsWith('/dev')) {
      localStorage.setItem('dev', 'true');
      alert('Dev mode has been turned on');
    }
    else if (window.location.pathname.endsWith('/auth')) {
      authUser(window.location.search);
    }

    setIsDevMode(localStorage.getItem('dev') == 'true');

    setHiddenPosts(JSON.parse(localStorage.getItem('hiddenPosts')) ?? []);

    navigateSource(window.location.pathname);
  }, []);

  const navigateSource = (src) => {
    var allowedSourceMatch = /\/(r\/\w+(\/comments\/\w+)?|u(ser)?\/\w+\/m\/\w+|comments\/\w+)/.exec(src);
    var resolvedSourceString;
    if (allowedSourceMatch) {
      resolvedSourceString = allowedSourceMatch[0];
    }
    else if (LocalStorageSources.length > 0) {
      resolvedSourceString = LocalStorageSources.find(s => s.selected).sourceString;
    }
    else {
      resolvedSourceString = '/r/all';
    }

    resolvedSourceString = resolvedSourceString.replace('/u/', '/user/'); //Allow /u/derekantrican as a shorthand for /user/derekantrican

    if (sourceString != null &&
        resolvedSourceString != sourceString && 
        !resolvedSourceString.includes('/comments/') &&
        !sourceString.includes('/comments/')) {
      //Reset posts when subscribed post source isn't changing (to give an empty view while the new content is grabbed)
      setPosts([]);
    }

    setSourceString(resolvedSourceString);
  }

  const getRedditData = async (requestPath) => {
    const url = `https://www.reddit.com${requestPath}/.json?limit=${process.env.NODE_ENV != 'production' ? 30 : 100}&raw_json=1`;

    const decayTime = 15 * 60 * 1000; //How long before we consider cached data "out of date" (in milliseconds)
    
    if (cache[requestPath] && (new Date() - cache[requestPath].updated) < decayTime) {
      return cache[requestPath].data;
    }

    try {
      setIsLoading(true);
      setError(null);

      let response = null;
      if (requestPath.includes('oauth.reddit.com')) {
        var matchingSource = LocalStorageSources.find(s => s.sourceString == requestPath);
        console.log('matchingSource:', matchingSource);

        if (matchingSource.expiration_date && new Date(matchingSource.expiration_date) < new Date()) {
          console.log("matchingSource's access_token is expired");
          const refreshData = refreshToken(matchingSource.refresh_token);

          matchingSource.access_token = refreshData.access_token;
          matchingSource.expiration_date = calculateExpiration(refreshData.expires_in);
          matchingSource.refresh_token = refreshData.refresh_token;
          
          saveSources();
        }

        response = await fetch(requestPath, {
          headers: {
            Authorization: `Bearer ${matchingSource.access_token}`,
          }
        });
      }
      else {
        response = await fetch(url);
      }


      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      cache[requestPath] = {
        data,
        updated : new Date(),
      };
      return cache[requestPath].data;
    }
    catch (e) {
      setError(e);
      alert(e); //Todo: this should be a toast or something else nicer
    }
    finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function getPosts() {
      if (sourceString) {
        setPostData(null); //reset

        if (process.env.NODE_ENV == 'production' && !sourceString.includes('oauth.reddit.com')) {
          window.history.pushState({}, null, baseUrl() + sourceString);
        }

        const data = await getRedditData(sourceString);
        if (sourceString.includes('/comments/')) {
          setPostData(data);
        }
        else if (data) {
          setPosts(data.data.children.filter(p => p.kind == 't3' /*filter to only posts (when viewing saves)*/).map(p => p.data));
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

  const hidePost = (id) => {
    const newHiddenPosts = hiddenPosts.concat([id]);
    setHiddenPosts(newHiddenPosts);
    localStorage.setItem('hiddenPosts', JSON.stringify(newHiddenPosts));
  };

  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition);
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [saveScrollPosition]);

  return (
    <div className={panelOpen ? 'noscroll' : ''/*Don't allow the screen to scroll while the panel is open*/}>
      {/*Todo: setting 'noscroll' (with 'height: 100%') causes the post scroll position to reset when the sidepanel is opened*/}
      {sourceString && !sourceString.includes('/comments/')
        ? <div>
            <Header togglePanel={() => setPanelOpen(!panelOpen)} isLoading={isLoading}/>
            <SideBar isOpen={panelOpen} closePanel={() => {
              setPanelOpen(false);
              navigateSource(null); //Navigating to an empty source will pull from localStorage
            }}/>
            <div style={{paddingTop: 55}}>
              {posts.filter(p => !hiddenPosts.includes(p.id)).map(p => 
                <PostListing key={p.id} post={p} isDevMode={isDevMode}
                  hidePost={(id) => hidePost(id)}
                  openPost={() => {
                    setLastSourceString(sourceString);
                    navigateSource(p.permalink);
                }}/>
              )}
            </div>
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

function Header(props) {
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  const handleScroll = () => {
    const cur = window.scrollY;
    const visible = scrollY > cur || cur < 50;

    setIsVisible(visible);
    setScrollY(cur);
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  return (
    <div style={{position: 'fixed', top: 0, width: '100%', zIndex: 1000, display: isVisible ? 'flex' : 'none', flexDirection: 'column', height: 55}}>
      <div style={{display: 'flex',  alignItems: 'center', height: 40, padding: 5, backgroundColor: '#3f3f3f'}}>
        <i style={{fontSize: '35px', marginRight: 10}} className='bi bi-list' onClick={props.togglePanel}/>
        <h2 style={{margin: 0}}>Readdit</h2>
      </div>
      {props.isLoading ?
        <div className="progress-bar">
          <div className="progress-bar-value"></div>
        </div>
      : null}
    </div>
  );
}

export default App;
