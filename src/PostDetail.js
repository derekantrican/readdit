function PostDetail(props) {
    //Todo: There will probably need to be some markdown rendering in the comments (or both)
    return (
      <div style={{display: 'flex', flexDirection: 'column', padding: 10}}>
        <PostDetailHeader data={props.data} close={props.close}/>
        <PostDetailComments data={props.data}/>
      </div>
    );
}
  
function PostDetailHeader(props) {
    //Todo: right now this is geared toward self posts, but we should be able to support galleries (eg functionalprint), etc
  
    return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
            <div>{props.data[0].data.children[0].data.score}</div>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-down-fill'/>
        </div>
        <div style={{margin: 10, fontWeight: 'bold'}}>{props.data[0].data.children[0].data.title}</div>
        <i style={{height: 30, width: 30, fontSize: '25px', marginLeft: 10}} className='bi bi-x-lg' onClick={() => props.close()}/>
        </div>
        {props.data[0].data.children[0].data.selftext ? <p style={{whiteSpace: 'pre-line'}}>{props.data[0].data.children[0].data.selftext}</p> : null}
    </div>
    );
}
  
function PostDetailComments(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {props.data[1].data.children.map(c =>
        <div key={c.id} style={{display: 'flex', flexDirection: 'row', borderWidth: '2px 0px 0px 0px', borderStyle: 'solid', borderColor: 'gray', padding: 5}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-up-fill'/>
            <div>{c.data.score}</div>
            <i style={{height: 15, width: 20, fontSize: '15px'}} className='bi bi-caret-down-fill'/>
          </div>
          <div style={{marginLeft: 10}}>{c.data.body}</div>
        </div>
      )}
    </div>
  );
}

export default PostDetail;