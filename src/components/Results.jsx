import { useMemo } from 'react';
import NeighborhoodCard from './NeighborhoodCard.jsx';

export default function Results({ results, allProperties, onViewMap }) {
  const propertyMap = useMemo(() => {
    const map = {};
    if (allProperties) {
      for (const p of allProperties) {
        if (!map[p.neighborhoodId]) map[p.neighborhoodId] = [];
        map[p.neighborhoodId].push(p);
      }
    }
    return map;
  }, [allProperties]);

  if (!results || results.length === 0) {
    return (
      <div className="results-panel">
        <div className="results-header">
          <h2>Results</h2>
        </div>
        <div className="results-empty">
          <p>Chat with the AI to find your perfect Austin neighborhood.</p>
          <p>Answer a few questions about your budget, lifestyle, and preferences to get personalized recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2>Top Matches</h2>
        <span className="results-count">{results.length} neighborhoods</span>
      </div>
      <div className="results-list">
        {results.map((n, i) => (
          <NeighborhoodCard
            key={n.id}
            neighborhood={n}
            properties={propertyMap[n.id] || []}
            rank={i + 1}
            onViewMap={onViewMap}
          />
        ))}
      </div>
    </div>
  );
}
