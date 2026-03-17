export default function PropertyCard({ property }) {
  const p = property;
  const amenities = p.amenities ? p.amenities.split(',').map(a => a.trim()) : [];

  return (
    <div className="property-card">
      <div className="pc-header">
        <h4>{p.name}</h4>
        <span className="pc-rent">${p.rent}/mo</span>
      </div>
      <div className="pc-details">
        <span>{p.beds} BR</span>
        <span className="pc-divider">|</span>
        <span>{p.address}</span>
      </div>
      <div className="pc-pets">{p.petPolicy}</div>
      <div className="pc-amenities">
        {amenities.map((a, i) => (
          <span key={i} className="amenity-tag">{a}</span>
        ))}
      </div>
      <div className="pc-contact">
        {p.phone && <span>{p.phone}</span>}
        {p.website && (
          <>
            <span className="pc-divider">|</span>
            <a href={p.website} target="_blank" rel="noreferrer">Website</a>
          </>
        )}
      </div>
    </div>
  );
}
