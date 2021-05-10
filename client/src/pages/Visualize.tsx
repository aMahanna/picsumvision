import React, { useState, useEffect } from 'react';
import Graph from 'react-graph-vis';
import { CircularProgress, Container } from '@material-ui/core';
import { useTranslation } from 'react-i18next';
import Alert from '../components/Alert';

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
  const [sorryAlert, setSorryAlert] = useState(false);
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

  /**
   * @useEffect fetches Visualization data of the user's last search
   * - Updates the state of the graph with the endpoint's response
   */
  useEffect(() => {
    fetch(`/api/search/mixed?labels=${lastSearch}&isVisualizeRequest=true`)
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
          setSorryAlert(true);
        }
      });
  }, []);

  return (
    <Container maxWidth="lg">
      <h4>
        {t('visualizerPage.lastSearch')} "{lastSearch}"
      </h4>
      {graph.nodes.length === 0 && <CircularProgress color="inherit" />}
      {graph.nodes.length !== 0 && (
        <Graph graph={graph} options={options} events={{}} style={{ border: 'solid', borderRadius: '1cm', height: '70vh' }} />
      )}
      <Alert
        open={sorryAlert}
        message={`${t('searchPage.sorryAlert')}`}
        severity="error"
        onSnackbarClose={(e, r) => {
          return r === 'clickaway' ? undefined : setSorryAlert(false);
        }}
        onAlertClose={() => setSorryAlert(false)}
      ></Alert>
    </Container>
  );
};

export default Visualize;
