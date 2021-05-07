import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Graph from 'react-graph-vis';
import { CircularProgress, Container, CssBaseline } from '@material-ui/core';
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
const Visualize = () => {
  const [t] = useTranslation();
  const [graph, setGraph]: any = useState(undefined); // The main Graph object
  const events = {
    // The events that the Graph object listens to
    select: ({ nodes, edges }: { nodes: any; edges: any }) => {
      if (nodes.length !== 0) alert('Selected node: ' + nodes);
    },
  };

  const [lastSearch] = useState(() => {
    // Fetch the user's last search
    const persistedState = localStorage.getItem('lastSearch');
    return persistedState ? JSON.parse(persistedState) : {};
  });

  /**
   * @useEffect fetches Visualization data of the user's last search
   * - Updates the state of the graph with the endpoint's response
   */
  useEffect(() => {
    fetch(`/api/search/mixed?labels=${lastSearch}&isVisualizeRequest=true`)
      .then(result => result.json())
      .then(response => {
        const nodes: { id: string; label: string; color: string }[] = response.graphObject.nodes;
        const edges: { id: string; from: string; to: string; label: string }[] = response.graphObject.edges;
        setGraph({
          nodes,
          edges,
        });
      });
  }, []);

  return (
    <Container maxWidth="lg">
      <CssBaseline />
      <h4>{t('visualizerPage.lastSearch')} "{lastSearch}"</h4>
      {graph !== undefined && (
        <Graph graph={graph} options={options} events={events} style={{ border: 'solid', borderRadius: '1cm', height: '70vh' }} />
      )}
      {graph === undefined && <CircularProgress />}
    </Container>
  );
};

export default Visualize;
