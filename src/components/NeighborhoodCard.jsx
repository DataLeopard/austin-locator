import { useState } from 'react';
import PropertyCard from './PropertyCard.jsx';

export default function NeighborhoodCard({ neighborhood, properties, rank, onViewMap }) {
  const [expanded, setExpanded] = useState(false);
  const n = neighborhood;

  const scoreColor = n.matchScore >= 75 ? '#4caf50' : n.matchScore >= 50 ? '#ff9800' : '#ff5722';
  const vibes = n.vibe ? n.vibe.split(',').map(v => v.trim()) : [];

  return (
    <div className={`neighborhood-card ${expanded ? 'expanded' : ''}`}>
      <div className="nc-header" onClick={() => setExpanded(!expanded)}>
        <div className="nc-rank">#{rank}</div>
        <div className="nc-title">
          <h3>{n.name}</h3>
          <span className="nc-area">{n.area}</span>
        </div>
        <div className="nc-score" style={{ color: scoreColor }}>
          {n.matchScore}%
        </div>
      </div>

      <div className="nc-vibes">
        {vibes.map((v, i) => (
          <span key={i} className="vibe-tag">{v}</span>
        ))}
      </div>

      <div className="nc-stats">
        <div className="nc-stat">
          <span className="stat-label">1BR</span>
          <span className="stat-value">${n.avgRent1br}</span>
        </div>
        <div className="nc-stat">
          <span className="stat-label">2BR</span>
          <span className="stat-value">${n.avgRent2br}</span>
        </div>
        <div className="nc-stat">
          <span className="stat-label">Walk</span>
          <span className="stat-value">{n.walkScore}</span>
        </div>
        <div className="nc-stat">
          <span className="stat-label">Pets</span>
          <span className="stat-value">{n.petFriendly ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {n.matchReasons && n.matchReasons.length > 0 && (
        <div className="nc-reasons">
          {n.matchReasons.slice(0, 3).map((r, i) => (
            <span key={i} className="reason-tag">{r}</span>
          ))}
        </div>
      )}

      <div className="nc-actions">
        <button className="btn-small" onClick={() => onViewMap(n)}>View on Map</button>
        <button className="btn-small btn-outline" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide' : 'Show'} Properties ({properties?.length || 0})
        </button>
      </div>

      {expanded && properties && properties.length > 0 && (
        <div className="nc-properties">
          {properties.map((p, i) => (
            <PropertyCard key={i} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
