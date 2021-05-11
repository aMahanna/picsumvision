/**
 * @component used to render the search results in a grid layout
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, ImageList, ImageListItem, ImageListItemBar, IconButton } from '@material-ui/core';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import StarIcon from '@material-ui/icons/Star';

import usePersistedState from '../hooks/usePersistedState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Gallery = (props: any) => {
  const [persistedFavourites, setPersistedFavourites] = usePersistedState('favourites', {}); // Persist previous results to use for search history
  const isFavourite = (id: string) => {
    return persistedFavourites[id] !== undefined;
  };

  const setIsFavourite = (id: string, author: string) => {
    if (persistedFavourites[id]) {
      const newFavourites = { ...persistedFavourites };
      delete newFavourites[id];
      setPersistedFavourites({
        ...newFavourites,
      });
    } else {
      setPersistedFavourites({
        ...persistedFavourites,
        [id]: {
          date: new Date(),
          author: author,
        },
      });
    }
  };

  return (
    <div>
      <Box mt={3}>
        <ImageList variant="masonry" style={{ overflowY: 'hidden' }} cols={props.data.length <= 2 ? 1 : 2}>
          {props.data.map((item: { url: string; author: string; _key: string }) => (
            <ImageListItem key={item.url}>
              <Link to={{ pathname: `/info/${item._key}`, state: { fromSearch: props.fromSearch } }}>
                <img className={props.imageClass} src={item.url} alt={item.author} loading="lazy" />
              </Link>
              <ImageListItemBar
                position="bottom"
                title={item.author}
                actionIcon={
                  <IconButton
                    sx={{ color: 'white' }}
                    aria-label={`star ${item.author}`}
                    onClick={() => setIsFavourite(item._key, item.author)}
                  >
                    {!isFavourite(item._key) && <StarBorderIcon />}
                    {isFavourite(item._key) && <StarIcon />}
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    </div>
  );
};

export default Gallery;
