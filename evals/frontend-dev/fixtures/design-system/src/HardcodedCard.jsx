/**
 * HardcodedCard — a component that uses hardcoded style values
 * instead of the design tokens defined in tokens.js.
 * Used as a fixture for design-system compliance evals.
 *
 * Violations present (all have token equivalents):
 * 1. Colors: #333, #1a73e8, #f5f5f5, #666, #e0e0e0, #fff, #1557b0
 * 2. Spacing: 16px, 24px, 12px, 8px, 4px, 32px
 * 3. Border radius: 8px
 * 4. Box shadow: raw value instead of token
 * 5. Font sizes: 14px, 20px, 12px
 * 6. Font weight: 600
 * 7. Transition: raw value
 * 8. Z-index: raw value
 */
export function HardcodedCard({ title, description, imageUrl, tags = [], onAction }) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        padding: '24px',
        maxWidth: '400px',
        transition: 'box-shadow 250ms ease-in-out',
        position: 'relative',
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        />
      )}

      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#333',
          margin: '0 0 8px 0',
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: 1.5,
          margin: '0 0 16px 0',
        }}
      >
        {description}
      </p>

      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: '#f5f5f5',
                color: '#666',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={onAction}
        style={{
          backgroundColor: '#1a73e8',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 150ms ease-in-out',
          width: '100%',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#1557b0';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#1a73e8';
        }}
      >
        Learn More
      </button>

      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}
      >
        <span
          style={{
            backgroundColor: '#1a73e8',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          New
        </span>
      </div>
    </div>
  );
}

export default HardcodedCard;
