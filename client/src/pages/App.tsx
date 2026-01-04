import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Import React Components
import NavBar from '../components/NavBar';
import Landing from './Landing';
import Search from './Search';
import Visualize from './Visualize';
import History from './History';
import Info from './Info';
import About from './About';

/**
 * The Main React Component
 * @returns The render of what the React DOM should look like
 */
const App = () => {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/visualize" element={<Visualize />} />
        <Route path="/visualize/:id" element={<Visualize />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
        <Route path="/info/:id" element={<Info />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
