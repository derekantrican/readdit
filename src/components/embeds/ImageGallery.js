function ImageGallery(props) {
  //TEMP (until we can return a proper, pageable display)
  const getImage = () => {
    var firstImageData = props.post.media_metadata[props.post.gallery_data.items[0].media_id];
    return firstImageData.s.u ?? firstImageData.s.gif;
  }

  return (
    <img height='100%' width='100%' style={{marginTop: 10}} src={getImage()}/>
  );
}

export default ImageGallery;