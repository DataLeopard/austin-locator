import { useState, useEffect, useCallback } from 'react';
import Chat from './components/Chat.jsx';
import AustinMap from './components/AustinMap.jsx';
import Results from './components/Results.jsx';
import { initDB, getAllNeighborhoods, queryAllProperties } from './data/austin-db.js';
import { createAgent } from './data/agent.js';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [results, setResults] = useState(null);
  const [highlighted, setHighlighted] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // mobile tabs

  useEffect(() => {
    async function init() {
      try {
        await initDB();
        const hoods = getAllNeighborhoods();
        const props = queryAllProperties();
        setNeighborhoods(hoods);
        setAllProperties(props);
        setAgent(createAgent());
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleResults = useCallback((r) => {
    setResults(r);
    // On mobile, switch to results tab
    if (window.innerWidth < 768) {
      setActiveTab('results');
    }
  }, []);

  const handleHighlight = useCallback((h) => {
    setHighlighted(h);
  }, []);

  const handleViewMap = useCallback((n) => {
    setHighlighted([n]);
    if (window.innerWidth < 768) {
      setActiveTab('map');
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2>Austin Locator</h2>
        <p>Loading neighborhood database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <h1>Austin Locator</h1>
          <span className="header-subtitle">AI-Powered Neighborhood Finder</span>
        </div>
        <div className="header-stats">
          <span>{neighborhoods.length} neighborhoods</span>
          <span className="header-divider">|</span>
          <span>{allProperties.length} properties</span>
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav className="mobile-tabs">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
      </nav>

      <main className="app-main">
        <div className={`panel panel-chat ${activeTab === 'chat' ? 'active' : ''}`}>
          <Chat
            agent={agent}
            onResults={handleResults}
            onHighlight={handleHighlight}
          />
        </div>
        <div className={`panel panel-map ${activeTab === 'map' ? 'active' : ''}`}>
          <AustinMap
            neighborhoods={neighborhoods}
            results={results}
            highlighted={highlighted}
            onSelectNeighborhood={handleViewMap}
          />
        </div>
        <div className={`panel panel-results ${activeTab === 'results' ? 'active' : ''}`}>
          <Results
            results={results}
            allProperties={allProperties}
            onViewMap={handleViewMap}
          />
        </div>
      </main>
    </div>
  );
}
