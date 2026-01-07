import './App.css';
import { useEffect, useState } from 'react';
import PostListing from './components/PostListing';
import PostDetail from './components/PostDetail';
import UserDetail from './components/UserDetail';
import SideBar from './components/Sidebar';
import { authUser, calculateExpiration, refreshToken } from './utils/authUser';
import { LocalStorageSources, readSources, saveSources } from './utils/sourcesManager';
import { LocalStorageSettings, readSettings, storage } from './utils/settingsManager';
import { baseUrl } from './utils/config';

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
  const [currentView, setCurrentView] = useState('postList');
  const [postData, setPostData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userAboutData, setUserAboutData] = useState(null);
  const [username, setUsername] = useState(null);

  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    if (window.location.pathname.endsWith('/dev')) {
      storage.setDevMode(true);
      alert('Dev mode has been turned on');
    }
    else if (window.location.pathname.endsWith('/auth')) {
      authUser(window.location.search);
    }

    setIsDevMode(storage.isDevMode());

    setHiddenPosts(storage.getHiddenPosts());

    navigateSource(window.location.pathname);
  }, []);

  const navigateSource = (src) => {
    readSources();
    readSettings();

    // Normalize /u/ to /user/ before pattern matching
    const normalizedSrc = src?.replace('/u/', '/user/');

    var allowedSourceMatch = /\/(r\/\w+(\/comments\/\w+)?|u(ser)?\/\w+\/m\/\w+|comments\/\w+|user\/\w+)/.exec(normalizedSrc);
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

    if (sourceString != null &&
        resolvedSourceString != sourceString && 
        !resolvedSourceString.includes('/comments/') &&
        !sourceString.includes('/comments/') &&
        !resolvedSourceString.match(/\/user\/\w+$/)) {
      //Reset posts when subscribed post source isn't changing (to give an empty view while the new content is grabbed)
      setPosts([]);
    }

    setSourceString(resolvedSourceString);
  }

  const getRedditData = async (requestPath, postNextToken) => {
    // Normalize /u/ to /user/ for consistency
    const normalizedPath = requestPath.replace('/u/', '/user/');
    
    const urlParams = `limit=${process.env.NODE_ENV != 'production' ? 30 : 100}` +
    `${postNextToken ? `&after=${postNextToken}` : ''}` +
    `&raw_json=1`;

    let url = null;
    if (normalizedPath.includes('oauth.reddit.com')) {
      url = `${normalizedPath}?${urlParams}`;
    }
    else {
      url = `https://www.reddit.com${normalizedPath}/.json?${urlParams}`;
    }

    const decayTime = LocalStorageSettings.expirationTimeMin * 60 * 1000; //How long before we consider cached data "out of date" (in milliseconds)
    
    if (cache[normalizedPath] && (!postNextToken || (cache[normalizedPath].nextTokens ?? []).includes(postNextToken)) && (new Date() - cache[normalizedPath].updated) < decayTime) {
      return cache[normalizedPath].data;
    }

    try {
      setIsLoading(true);
      setError(null);

      let response = null;
      if (normalizedPath.includes('oauth.reddit.com')) {
        var matchingSource = LocalStorageSources.find(s => s.sourceString == normalizedPath);

        if (matchingSource.expiration_date && new Date(matchingSource.expiration_date) < new Date()) {
          const refreshData = await refreshToken(matchingSource.refresh_token);

          matchingSource.access_token = refreshData.access_token;
          matchingSource.expiration_date = calculateExpiration(refreshData.expires_in);
          matchingSource.refresh_token = refreshData.refresh_token;
          
          saveSources(LocalStorageSources);
        }

        response = await fetch(url, {
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

      if (postNextToken) {
        cache[normalizedPath].data.data.children = cache[normalizedPath].data.data.children.concat(data.data.children); //Concat the "nextToken posts" with the previous ones
        cache[normalizedPath].nextTokens = (cache[normalizedPath].nextTokens ?? []).concat([postNextToken]);

        return data; //Return only this next page of posts (because 'loadMorePosts' is expecting only this next page)
      }
      else {
        cache[normalizedPath] = {
          data,
          updated : new Date(),
        };

        return cache[normalizedPath].data;
      }

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
        if (process.env.NODE_ENV == 'production' && !sourceString.includes('oauth.reddit.com')) {
          window.history.pushState({}, null, baseUrl() + sourceString);
        }

        // Check if this is a user profile view
        const userMatch = /\/user\/(\w+)$/.exec(sourceString);
        if (userMatch) {
          const user = userMatch[1];
          setUsername(user);
          setCurrentView('userDetail');
          const data = await getRedditData(`/user/${user}`);
          if (data) {
            setUserData(data);
          }
          const aboutData = await getRedditData(`/user/${user}/about`);
          if (aboutData) {
            setUserAboutData(aboutData);
          }
        }
        else {
          const data = await getRedditData(sourceString);
          if (sourceString.includes('/comments/')) {
            setCurrentView('postDetail'); //This might be set already, but setting again in case someone is coming from a direct post link
            setPostData(data);
          }
          else if (data) {
            setPosts(data.data.children.filter(p => p.kind == 't3' /*filter to only posts (when viewing saves)*/).map(p => p.data));
            setNextToken(data.data.after);
            setCurrentView('postList');
          }
        }
      }
    }
    
    getPosts();
  }, [sourceString]);

  const restoreScrollPosition = () => {
    if (sourceString) {
      const normalizedSource = sourceString.replace('/u/', '/user/');
      if (sourceString.includes('/comments/')) {
        window.scrollTo({top: 0, left: 0, behavior: 'instant'}); //Reset scroll position for comments view
      }
      else {
        window.scrollTo({top: cache[normalizedSource]?.scrollY ?? 0, left: 0, behavior: 'instant'}); //Restore scroll position
      }
    }
  };

  const saveScrollPosition = () => {
    if (!panelOpen) { //Don't save the scroll position if the sidepanel is open
      const normalizedSource = sourceString?.replace('/u/', '/user/');
      if (cache[normalizedSource]) {
        cache[normalizedSource].scrollY = window.scrollY;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition);
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [saveScrollPosition]);

  useEffect(() => {
    //Restore scroll position after sidepanel closes or after currentView changes
    //(I tried a few different methods, but this seemed to be the only one that 
    // worked with the timing of state changes)
    if (!panelOpen) {
      restoreScrollPosition();
    }
  }, [panelOpen, currentView]);

  const hidePost = (id) => {
    const newHiddenPosts = hiddenPosts.concat([id]);
    setHiddenPosts(newHiddenPosts);
    storage.setHiddenPosts(newHiddenPosts);
  };

  const loadMorePosts = async () => {
    const data = await getRedditData(sourceString, nextToken);
    if (data) {
      setPosts(posts.concat(data.data.children.filter(p => p.kind == 't3' /*filter to only posts (when viewing saves)*/).map(p => p.data)));
      setNextToken(data.data.after);
    }
  };

  return (
    <div className={panelOpen ? 'noscroll' : ''/*Don't allow the screen to scroll while the panel is open*/}>
      {currentView == 'postList'
        ? <div>
            <Header togglePanel={() => setPanelOpen(!panelOpen)} panelOpen={panelOpen} isLoading={isLoading}/>
            <SideBar isOpen={panelOpen} closePanel={() => {
              setPanelOpen(false);
              navigateSource(null); //Navigating to an empty source will pull from localStorage
            }}/>
            <div style={{paddingTop: 55}}>
              {posts
                .filter(p => !hiddenPosts.includes(p.id))
                .filter(p => !(storage.getSettings().hideAnnouncements && p.stickied))
                .map(p => 
                <PostListing key={p.id} post={p} isDevMode={isDevMode}
                  hidePost={(id) => hidePost(id)}
                  openPost={() => {
                    setPostData([{data:{children:[{data:p}]}}]); //set post data ahead of time (before postData is actually fetched)
                    setCurrentView('postDetail');
                    
                    setLastSourceString(sourceString);
                    navigateSource(p.permalink);
                }}/>
              )}
              {posts.length > 0 //Don't show the "Load More" button until the posts have loaded
                ? <button style={{display: 'block', width: 'calc(100% - 10px)', margin: '10px 5px', height: 40}} onClick={loadMorePosts}>Load More</button>
                : null
              }
            </div>
          </div>
        : currentView == 'postDetail'
        ? <PostDetail 
            data={postData}
            openUser={(user) => {
              setLastSourceString(sourceString);
              navigateSource(`/user/${user}`);
            }}
            close={() => {
              navigateSource(lastSourceString);
              setLastSourceString(null);
          }}/> 
        : currentView == 'userDetail'
        ? <UserDetail
            username={username}
            data={userData}
            aboutData={userAboutData}
            openPost={(permalink) => {
              setLastSourceString(sourceString);
              navigateSource(permalink);
            }}
            close={() => {
              navigateSource(lastSourceString);
              setLastSourceString(null);
            }}/>
        : null
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
        <div className={`menu-btn ${props.panelOpen ? 'close' : ''}`} onClick={props.togglePanel}>
          <div className="btn-line"></div>
          <div className="btn-line"></div>
          <div className="btn-line"></div>
        </div>
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
