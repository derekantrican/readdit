import { useEffect, useState } from "react";

export function SideBar(props) {
  const [sources, setSources] = useState([]);

  const handleValueChange = (newSourceString, index) => {
    setSources(sources.map((v,i) => {
        if (i == index) {
            v.sourceString = newSourceString
        }

        return v;
    }));
  };

  const selectSource = (index) => {
    setSources(sources.map((s, i) => {
        s.selected = i == index;
        return s;
    }));
  };

  const deleteSource = (index) => {
    var newSources = sources.filter((v, i) => i != index);
    if (newSources.length > 0 && newSources.find(s => s.selected) == null) {
        //If the selected source was deleted, mark the first one as selected
        newSources[0].selected = true;
    }

    setSources(newSources);
  };

  const addSource = () => {
    setSources(sources.concat({
        sourceString : '',
        selected : sources.length == 0, //Select the source by default if it is the only one
    }));
  };

  const saveChanges = () => {
    //Todo: validate source strings (use the regex in App.navigateSource) and show validation errors
    localStorage.setItem('sources', JSON.stringify(sources));
    props.closePanel();
  };
  
  useEffect(() => {
    setSources(JSON.parse(localStorage.getItem('sources')) ?? []);
  }, []);

  return (
    <div className={props.isOpen ? "sidebar open" : "sidebar"}>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex'}}>
            <h2 style={{margin: 5}}>Sources</h2>
            <div style={{flex: '1 0 0'}}/>{/*Fill available space so close button is always at the far right*/}
            <i style={{fontSize: '25px', margin: '5px 10px 0px 0px'}} className='bi bi-x-lg' onClick={props.closePanel}/>
        </div>
        <p style={{margin: 5}}>Add any sources such as...</p>
        <ul style={{margin: 5}}>
            <li>Subreddit (eg '/r/funny')</li>
            <li>Public multireddit (eg '/u/soupyhands/m/climbing')</li>
            <li>Multiple subreddits (eg '/r/funny+gifs+videos')</li>
        </ul>
        {sources.length == 0 ? 
            <div style={{color: 'yellow', margin: 10}}>No sources (defaulting to '/r/all'). Click '+' to add one!</div>
        :null}
        {sources.map((source, index) =>
            <div key={index} style={{display: 'flex'}}>
                <input style={{margin: 5, height: 30, flex: '1 0 0'}} type='text' value={source.sourceString}
                        onChange={e => handleValueChange(e.target.value, index)}/>
                {/*Select source*/}
                <button style={{margin: 5}} onClick={() => selectSource(index)}>
                    <i style={{fontSize: '20px'}} className={`bi bi-circle${source.selected ? '-fill' : ''}`}/>
                </button>
                {/*Delete source*/}
                <button style={{margin: 5}} onClick={() => deleteSource(index)}>
                    <i style={{fontSize: '20px'}} className='bi bi-trash'/>
                </button>
            </div>
        )}
        <button style={{margin: 5, width: 200, alignSelf: 'center'}} onClick={() => addSource()}>
            <i style={{fontSize: '25px'}} className='bi bi-plus'/>
        </button>
        <button style={{margin: '40px 5px 5px 5px', height: 40}} onClick={saveChanges}>
                Save
        </button>
      </div>
    </div>
  );
}

export default SideBar;