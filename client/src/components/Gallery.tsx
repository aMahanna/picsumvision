import * as React from 'react';
import { Link } from 'react-router-dom';
import { Box, ImageList, ImageListItem, ImageListItemBar } from '@material-ui/core';

export default function Gallery(props: any) {
  return (
    <div>
      <Box mt={3}>
        <ImageList variant="masonry" cols={props.data.length < 3 ? 1 : 3} gap={8}>
          {props.data.map((item: { url: string; author: string }) => (
            <ImageListItem key={item.url}>
              <Link to={`/info/${item.url.split('/')[4]}`}>
                <img className={props.imageClass} src={item.url} alt={item.author} loading="lazy" />
              </Link>
              <ImageListItemBar position="bottom" title={item.author} />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    </div>
  );
}
