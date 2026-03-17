import { useEffect, useRef } from 'react';
import L from 'leaflet';

const AUSTIN_CENTER = [30.2672, -97.7431];
const AUSTIN_ZOOM = 11;

function getMarkerColor(score) {
  if (score === undefined || score === null) return '#888';
  if (score >= 75) return '#4caf50';
  if (score >= 50) return '#ff9800';
  if (score >= 25) return '#ff5722';
  return '#888';
}

function createIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "><div style="
      transform: rotate(45deg);
      color: #fff;
      font-size: 11px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function AustinMap({ neighborhoods, results, highlighted, onSelectNeighborhood }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: AUSTIN_CENTER,
      zoom: AUSTIN_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !neighborhoods || neighborhoods.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const scoreMap = {};
    if (results) {
      for (const r of results) {
        scoreMap[r.name] = r.matchScore;
      }
    }

    const highlightNames = new Set();
    if (highlighted) {
      for (const h of highlighted) {
        highlightNames.add(h.name);
      }
    }

    for (const n of neighborhoods) {
      const score = scoreMap[n.name];
      const isHighlighted = highlightNames.has(n.name);
      const color = results ? getMarkerColor(score) : (isHighlighted ? '#bf5700' : '#888');

      const marker = L.marker([n.lat, n.lng], {
        icon: createIcon(isHighlighted ? '#bf5700' : color),
      }).addTo(mapInstanceRef.current);

      const rentKey = 'avgRent1br';
      const popup = `
        <div style="color:#1a1a1d;min-width:180px;">
          <strong style="font-size:14px;">${n.name}</strong>
          ${score !== undefined ? `<br/><span style="color:${getMarkerColor(score)};font-weight:bold;">${score}% match</span>` : ''}
          <br/><small>${n.vibe}</small>
          <br/>1BR: $${n[rentKey]}/mo
          <br/>Walk: ${n.walkScore}/100
          <br/><em style="font-size:11px;">${n.description.slice(0, 80)}...</em>
        </div>
      `;
      marker.bindPopup(popup);
      marker.on('click', () => {
        if (onSelectNeighborhood) onSelectNeighborhood(n);
      });

      markersRef.current.push(marker);
    }
  }, [neighborhoods, results, highlighted, onSelectNeighborhood]);

  // Fly to highlighted neighborhoods
  useEffect(() => {
    if (!mapInstanceRef.current || !highlighted || highlighted.length === 0) return;

    if (highlighted.length === 1) {
      mapInstanceRef.current.flyTo([highlighted[0].lat, highlighted[0].lng], 14, { duration: 1 });
    } else {
      const bounds = L.latLngBounds(highlighted.map(h => [h.lat, h.lng]));
      mapInstanceRef.current.flyToBounds(bounds.pad(0.3), { duration: 1 });
    }
  }, [highlighted]);

  return (
    <div className="map-panel">
      <div ref={mapRef} className="map-container" />
    </div>
  );
}
