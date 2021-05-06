import Graph from 'react-graph-vis';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Container, CssBaseline } from '@material-ui/core';

interface vertice {
  _id: string;
  _key: string;
  data: string;
}

interface connection {
  i: {
    _id: string;
    _key: string;
    author: string;
    url: string;
    count: number;
  };
  edges: {
    _id: string;
    _key: string;
    _from: string;
    _to: string;
    _score: number;
  }[];
}

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
        let nodes: { id: string; label: string; color: string }[] = [];
        let edges: { id: string; from: string; to: string; label: string }[] = [];

        for (let i = 0; i < response.data.vertices.length; i++) {
          const vertice: vertice = response.data.vertices[i];
          nodes = nodes.concat([{ id: vertice._id, label: vertice.data, color: '#41BBD9' }]);
        }

        for (let j = 0; j < response.data.connections.length; j++) {
          const connect: connection = response.data.connections[j];
          nodes = nodes.concat([{ id: connect.i._id, label: connect.i._key, color: '#F18F01' }]);
          for (let t = 0; t < connect.edges.length; t++) {
            const edge = connect.edges[t];
            edges = edges.concat([{ id: edge._id, from: edge._from, to: edge._to, label: String(edge._score) }]);
          }
        }

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
