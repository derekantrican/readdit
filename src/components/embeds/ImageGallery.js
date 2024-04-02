function ImageGallery(props) {
  //TEMP (until we can return a proper, pageable display)
  const getImage = () => {
    var firstImageData;
    for (var media of props.post.gallery_data.items) {
      if (props.post.media_metadata[media.media_id].status == 'valid') {
        firstImageData = props.post.media_metadata[media.media_id];
        break;
      }
    }

    if (firstImageData) {
      return firstImageData.s.u ?? firstImageData.s.gif;
    }
  }

  return (
    <img height='100%' width='100%' style={{marginTop: 10}} src={getImage()}/>
  );
}

export default ImageGallery;