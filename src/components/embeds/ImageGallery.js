import { useEffect, useState } from "react";

function ImageGallery(props) {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    const imageList = [];
    for (var media of props.post.gallery_data.items) { //gallery_data dictates the order of the images
      if (props.post.media_metadata[media.media_id].status == 'valid') {
        var metadata = props.post.media_metadata[media.media_id];
        imageList.push(metadata.s.u ?? metadata.s.gif);
      }
    }

    setImages(imageList);
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
      {/*Todo: currently this causes the image block to change size whenever the image changes (if it's a different size)*/}
      <img height='100%' width='100%' src={images[currentImageIndex]}/>
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