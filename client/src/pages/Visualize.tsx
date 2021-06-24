import React, { useState, useEffect } from 'react';
import Graph from 'react-graph-vis';
import { CircularProgress, Container } from '@material-ui/core';
import { useTranslation } from 'react-i18next';

const options = {
  layout: {
    hierarchical: false,
    improvedLayout: true,
  },
  edges: {
    color: '#2f2d2e',
  },
  interaction: {
    hover: true,
    hideEdgesOnDrag: true,
    hideEdgesOnZoom: true,
    zoomSpeed: 0.8,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [graph, setGraph]: any = useState({
    nodes: [],
    edges: [],
  });

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
      <h4>
        {visualizationType === 'search'
          ? `${t('visualizerPage.search')} "${persistedData[lastSearch].input}"`
          : `${t('visualizerPage.image')} #${props.match.params.id}`}
      </h4>
      {graph.nodes.length === 0 && <CircularProgress color="inherit" />}
      {graph.nodes.length !== 0 && (
        <Graph graph={graph} options={options} events={{}} style={{ border: 'solid', borderRadius: '1cm', height: '70vh' }} />
      )}
    </Container>
  );
};

export default Visualize;
