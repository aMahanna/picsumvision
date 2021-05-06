import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Graph from 'react-graph-vis';
import { Container, CssBaseline } from '@material-ui/core';

const options = {
  layout: {
    hierarchical: false,
  },
  edges: {
    color: '#2f2d2e',
  },
};

const Visualize = (props: any) => {
  const [graph, setGraph]: any = useState(undefined);
  const [lastSearch] = useState(() => {
    const persistedState = localStorage.getItem('lastSearch');
    return persistedState ? JSON.parse(persistedState) : {};
  });
  const events = {
    select: ({ nodes, edges }: { nodes: any; edges: any }) => {
      if (nodes.length !== 0) alert('Selected node: ' + nodes);
    },
  };

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
    <Container>
      <CssBaseline />
      <h4>Last search: {lastSearch}</h4>
      {graph !== undefined && <Graph graph={graph} options={options} events={events} style={{ height: '640px' }} />}
    </Container>
  );
};

export default Visualize;
