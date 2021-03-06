import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import Graph from 'react-graph-vis';
import { CircularProgress, Container, Box } from '@material-ui/core';
import { useTranslation } from 'react-i18next';

const options = {
  layout: {
    hierarchical: false,
    improvedLayout: true,
  },
  nodes: {
    shape: 'circle',
    widthConstraint: {
      maximum: 140,
    },
  },
  interaction: {
    hover: true,
    hideEdgesOnDrag: true,
    hideEdgesOnZoom: true,
    zoomSpeed: 0.8,
  },
  physics: {
    enabled: true,
    barnesHut: {},
    solver: 'barnesHut',
  },
};

/**
 * The page that allows users to visualize their search results through a Graph
 * @see VISJS.org
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Visualize = (props: any) => {
  const [t] = useTranslation();
  const isSearchVisualization = !props.match.params.id;
  const [imageRedirect, setImageRedirect] = useState('');
  const [tagRedirect, setTagRedirect] = useState('');
  const [imageCount, setImageCount] = useState(undefined);
  const [verticeCount, setVerticeCount] = useState(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [graph, setGraph]: any = useState({
    nodes: [],
    edges: [],
  });

  const events = {
    doubleClick: ({ nodes }: { nodes: string[] }) => {
      if (nodes.length === 1) {
        const nodeID = nodes[0];
        const type = nodeID.split('/')[0];

        if (['Tag', 'Author', 'BestGuess'].includes(type)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tag = graph.nodes.find((node: any) => node.id === nodeID).label;
          setTagRedirect(tag);
        }

        if (type === 'Image') {
          const key = nodeID.split('/')[1];
          setImageRedirect(key);
        }
      }
    },
  };

  const [lastSearch] = useState(() => {
    // Fetch the user's last search
    const persistedState = localStorage.getItem('lastSearch');
    return persistedState ? JSON.parse(persistedState) : {};
  });
  const [persistedData] = useState(() => {
    // Fetch the user's result history
    const persistedState = localStorage.getItem('data');
    return persistedState ? JSON.parse(persistedState) : {};
  });

  /**
   * @useEffect fetches Visualization data of the user's last search
   * - Updates the state of the graph with the endpoint's response
   */
  useEffect(() => {
    if (isSearchVisualization && (lastSearch === '' || !persistedData[lastSearch])) {
      props.history.push('/');
      return;
    }

    const url = `/api/search/visualize${isSearchVisualization ? 'search' : 'image'}`;
    const body = {
      lastSearch: isSearchVisualization ? lastSearch : undefined,
      lastResult: isSearchVisualization ? persistedData[lastSearch].data : undefined,
      imageID: isSearchVisualization ? undefined : props.match.params.id.split(','),
    };

    fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(result => (result.status === 200 ? result.json() : undefined))
      .then(response => {
        if (response) {
          setVerticeCount(response.verticeCount);
          setImageCount(response.imageCount);
          const nodes: { id: string; label: string; color: string }[] = response.graphObject.nodes;
          const edges: { id: string; from: string; to: string; label: string }[] = response.graphObject.edges;

          options.physics.barnesHut = {
            centralGravity: 0,
            springLength: 15 * nodes.length,
            springConstant: 0.1 / nodes.length,
            damping: 1,
            avoidOverlap: 0.75,
          };

          setGraph({
            nodes,
            edges,
          });
        } else {
          props.history.push('/');
        }
      });
  }, []);

  return (
    <Container maxWidth="lg">
      {imageRedirect !== '' && <Redirect to={{ pathname: `/info/${imageRedirect}` }} />}
      {tagRedirect !== '' && <Redirect to={{ pathname: '/search', state: { fromRedirect: tagRedirect } }} />}
      <h3>
        {isSearchVisualization && (persistedData[lastSearch] || lastSearch)
          ? `"${persistedData[lastSearch].isImageURL ? lastSearch : persistedData[lastSearch].input}"`
          : `${props.match.params.id}`}
      </h3>
      <h4>{t('visualizerPage.interact')}</h4>
      {graph.nodes.length === 0 && <CircularProgress color="inherit" />}
      {graph.nodes.length !== 0 && (
        <Box mb={5}>
          <Graph graph={graph} options={options} events={events} style={{ border: 'solid', height: '80vh' }} />
        </Box>
      )}
      <h4>{imageCount && verticeCount && `Images: ${imageCount} | ${t('visualizerPage.labels')}: ${verticeCount}`}</h4>
    </Container>
  );
};

export default Visualize;
