import { useEffect, useState } from "react";

function ImageGallery(props) {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  Array.prototype.max = function() {
    return Math.max.apply(null, this);
  };

  const sizeRatio = Object.values(props.post.media_metadata).filter(meta => meta.status == 'valid').map(meta => meta.s.y / meta.s.x).max();
  const height = sizeRatio * (window.screen.width - 30);
  
  useEffect(() => {
    const imageList = [];

    try {
      for (var media of props.post.gallery_data.items) { //gallery_data dictates the order of the images        
        // Todo: we should maybe change the approach here. https://reddit.com/r/homelab/comments/1nn96i5/thisll_have_to_do_until_our_next_house
        // is a post where NONE of the items in gallery_data.items are in media_metadata. So maybe we should just grab all the items from media_metadata
        // which have a 'valid' status? I don't think this necessarily guaruntees the correct order in the gallery, but that might work
        if (props.post.media_metadata[media.media_id].status == 'valid') {
          var metadata = props.post.media_metadata[media.media_id];
          imageList.push(metadata.s.u ?? metadata.s.gif);
        }
      }
  
      setImages(imageList);
    }
    catch (err) {
      console.error(err);
    }
  }, []);

  const buttonStyle = {
    position: 'absolute',
    top: '50%',
    borderRadius: '50%',
    borderColor: 'transparent',
    height: 32,
    width: 30,
    display: 'flex',
    justifyContent: 'center',
  }

  return (
    <div style={{position: 'relative', marginTop: 10}}>
      {/*Todo: images aren't loaded until the '->' button is clicked, so we should add some sort of loading indicator*/}
      <img style={{objectFit: 'contain'}} height={height} width='100%' src={images[currentImageIndex]}/>
      {currentImageIndex > 0 ?
        <button style={{...buttonStyle, left: 5}} onClick={() => setCurrentImageIndex(currentImageIndex - 1)}>
          <i style={{fontSize: '25px'}} className='bi bi-arrow-left-short'/>
        </button>
      : null}
      {currentImageIndex < images.length - 1 ?
        <button style={{...buttonStyle, right: 5}} onClick={() => setCurrentImageIndex(currentImageIndex + 1)}>
          <i style={{fontSize: '25px'}} className='bi bi-arrow-right-short'/>
        </button>
      : null}
    </div>
  );
}

export default ImageGallery;