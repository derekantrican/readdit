import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Fragment, useEffect, useState } from "react";
import { generateAuthUrl } from "../utils/authUser";
import { LocalStorageSources, readSources, saveSources } from "../utils/sourcesManager";
import { LocalStorageSettings, saveSettings } from "../utils/settingsManager";

export function SideBar(props) {
  const [sources, setSources] = useState([]);
  const [editingSources, setEditingSources] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Sources');
  const [pendingSettings, setPendingSettings] = useState(JSON.parse(JSON.stringify(LocalStorageSettings))); // Make a copy of the current settings

  const tabs = [
    'Sources',
    'Settings',
    ...localStorage.getItem('dev') == 'true' ? ['Dev'] : []
  ];

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
        id : crypto.randomUUID(),
    }));
  };

  const saveChanges = () => {
    //Todo: validate source strings (use the regex in App.navigateSource) and show validation errors
    saveSources(sources);
    saveSettings(pendingSettings);
    props.closePanel();
  };
  
  useEffect(() => {
    readSources();
    setSources(LocalStorageSources);
  }, []);

  const onDragEnd = result => {
    const { destination, source } = result;
    if (!destination || destination.index == source.index) {
      return;
    }

    sources.splice(destination.index, 0, sources.splice(source.index, 1)[0]); //This moves an item from one index to another
    setSources(sources);
  };

  return (
    <div className={props.isOpen ? "sidebar open" : "sidebar"}>
      <div style={{display: 'flex', flexDirection: 'column', height: 'calc(100vh - 55px)'}}>
        <div style={{display: 'flex', justifyContent: 'space-around', backgroundColor: '#3f3f3f'}}>
          {tabs.map(t =>
            <SideBarTab name={t} selected={selectedTab == t} onClick={() => setSelectedTab(t)}/>
          )}
        </div>
        {selectedTab == 'Sources' ?
          <Fragment>
            <p style={{margin: 5}}>Add any sources such as...</p>
            <ul style={{margin: '5px 5px 15px 5px'}}>
                <li>Subreddit (eg '/r/funny')</li>
                <li>Public multireddit (eg '/u/soupyhands/m/climbing')</li>
                <li>Multiple subreddits (eg '/r/funny+gifs+videos')</li>{/*Todo: I don't know if this format is really supported (seems that only the first sub is retrieved) */}
            </ul>
            {sources.length == 0 ? 
                <div style={{color: 'yellow', margin: 10}}>No sources (defaulting to '/r/all'). Click '+' to add one!</div>
            :null}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="droppable">
                {droppableProvided=> (
                  <div style={{display: 'flex', flexDirection: 'column', overflowY: 'scroll'}} ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                    {sources.map((source, index) =>
                      <Draggable key={source.id} draggableId={source.id} index={index} isDragDisabled={!editingSources}>
                        {draggableProvided => (
                          <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}
                            style={{display: 'flex' /*style needs to be after draggableProps*/, ...draggableProvided.draggableProps.style}}>
                            <input style={{margin: 5, height: 30, flex: '1 0 0'}} type='text' value={source.title ?? source.sourceString}
                                    onChange={e => handleValueChange(e.target.value, index)}/>
                            {editingSources ?
                              <Fragment>
                                {/*Reorder source*/}
                                <i {...draggableProvided.dragHandleProps}
                                  style={{fontSize: '25px', textAlign: 'center', width: 25, padding: 5, ...draggableProvided.dragHandleProps.style}}
                                  className='bi bi-list'/>
                                {/*Delete source*/}
                                <button style={{margin: 5}} onClick={() => deleteSource(index)}>
                                  <i style={{fontSize: '20px'}} className='bi bi-trash'/>
                                </button>
                              </Fragment>
                            :
                              <Fragment>
                                {/*Select source*/}
                                <button style={{margin: 5}} onClick={() => selectSource(index)}>
                                  <i style={{fontSize: '20px'}} className={`bi bi-circle${source.selected ? '-fill' : ''}`}/>
                                </button>
                              </Fragment>
                            }
                          </div>
                        )}
                      </Draggable>
                    )}
                    {droppableProvided.placeholder /*used to create space for drag-drop*/}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div style={{display: 'flex', justifyContent: 'end'}}>
              <button style={{margin: 5, width: 100, backgroundColor: '#0202ba', borderColor: 'transparent', borderRadius: '10%'}}
                onClick={() => window.location.replace(generateAuthUrl())}>
                Auth reddit
              </button>
              <button style={{margin: 5, width: 40}} onClick={() => addSource()}>
                  <i style={{fontSize: '25px'}} className='bi bi-plus'/>
              </button>
              {sources.length > 0 ? 
                <button style={{margin: 5, width: 40}} onClick={() => setEditingSources(!editingSources)}>
                  <i style={{fontSize: '20px'}} className={`bi bi-${editingSources ? 'check-lg' : 'pencil'}`}/>
                </button>
              :null}
            </div>
            <button style={{margin: '25px 5px 5px 5px', minHeight: 40}} onClick={saveChanges}>
              Save
            </button>
          </Fragment>
        : selectedTab == 'Settings' ?
          <Fragment>
            <div style={{margin: 10, display: 'flex', alignItems: 'center'}}>
                <div>Expiration time</div>
                <input
                  style={{margin: 10, height: 30, width: 50, padding: '0px 5px'}}
                  type='text' 
                  value={pendingSettings.expirationTimeMin}
                  onChange={e => setPendingSettings({...pendingSettings, expirationTimeMin: Number(e.target.value)})}/>
                <div>minutes</div>
            </div>
            <button style={{margin: '25px 5px 5px 5px', minHeight: 40}} onClick={saveChanges /* This save action will be the same as the sources one */}>
              Save
            </button>
          </Fragment>
        : selectedTab == 'Dev' ?
          <Fragment>
            <p style={{margin: 10}}>Dev mode</p>
          </Fragment>
        : null}  
      </div>
    </div>
  );
}

function SideBarTab(props) {
  const tabStyle = {
    padding: '7px 12px',
    borderBottom: `2px solid ${props.selected ? 'lightblue' : 'transparent'}`,
    fontWeight: props.selected ? 'bold' : 'normal',
    fontSize: 'x-large',
    textAlign: 'center',
  };

  return (
    <div style={tabStyle} onClick={props.onClick}>{props.name}</div>
  );
}

export default SideBar;