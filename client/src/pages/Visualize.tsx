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
  },
  interaction: {
    hover: true,
    hideEdgesOnDrag: true,
    hideEdgesOnZoom: true,
    zoomSpeed: 0.8,
  },
  physics: {
    enabled: true,
    barnesHut: {
      centralGravity: 0.01,
      springLength: 300,
      springConstant: 0.01,
      damping: 0.3,
      avoidOverlap: 1,
    },
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
  const visualizationType = props.match.params.id ? 'image' : 'search';
  const [imageRedirect, setImageRedirect] = useState('');
  const [tagRedirect, setTagRedirect] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [graph, setGraph]: any = useState({
    nodes: [],
    edges: [],
  });

  const events = {
    doubleClick: ({ nodes }: { nodes: any }) => {
      if (nodes.length === 1) {
        const nodeID = nodes[0];
        const type = nodeID.split('/')[0];

        if (type === 'Tag' || type === 'Author' || type === 'BestGuess') {
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
    const isSearch = visualizationType === 'search';
    if (isSearch && (lastSearch === '' || !persistedData[lastSearch])) {
      props.history.push('/');
      return;
    }

    fetch(`/api/search/visualize?type=${visualizationType}`, {
      method: 'POST',
      body: JSON.stringify({
        imageID: isSearch ? undefined : props.match.params.id,
        keyword: isSearch ? lastSearch : undefined,
        lastSearchResult: isSearch ? persistedData[lastSearch].data : undefined,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(result => (result.status === 200 ? result.json() : undefined))
      .then(response => {
        if (response) {
          const nodes: { id: string; label: string; color: string }[] = response.graphObject.nodes;
          const edges: { id: string; from: string; to: string; label: string }[] = response.graphObject.edges;
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
        {visualizationType === 'search'
          ? `${t('visualizerPage.search')} "${persistedData[lastSearch].isImageURL ? lastSearch : persistedData[lastSearch].input}"`
          : `${t('visualizerPage.image')} #${props.match.params.id}`}
      </h3>
      <h4>{t('visualizerPage.interact')}</h4>
      {graph.nodes.length === 0 && <CircularProgress color="inherit" />}
      {graph.nodes.length !== 0 && (
        <Box mb={5}>
          <Graph graph={graph} options={options} events={events} style={{ border: 'solid', height: '80vh' }} />
        </Box>
      )}
    </Container>
  );
};

export default Visualize;
