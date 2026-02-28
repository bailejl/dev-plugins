/**
 * DesktopGrid — a component with multiple responsive design violations.
 * Used as a fixture for responsive-check evals.
 *
 * Issues present:
 * 1. Fixed 1200px width container (overflows on mobile)
 * 2. 3-column grid with no responsive breakpoints
 * 3. Font sizes in px instead of rem
 * 4. No media queries at all
 * 5. Fixed pixel widths on cards
 * 6. Small touch targets (links with no padding)
 * 7. 100vh usage (mobile browser chrome issue)
 * 8. Images without max-width: 100%
 * 9. Hardcoded spacing values
 * 10. No flex-wrap on horizontal nav
 */
export function DesktopGrid({ items = [] }) {
  const defaultItems = items.length > 0 ? items : [
    { id: 1, title: 'Analytics', description: 'View your analytics dashboard with detailed metrics and charts.', image: '/analytics.png', link: '/analytics' },
    { id: 2, title: 'Reports', description: 'Generate and download reports in various formats.', image: '/reports.png', link: '/reports' },
    { id: 3, title: 'Settings', description: 'Configure your account preferences and notifications.', image: '/settings.png', link: '/settings' },
    { id: 4, title: 'Users', description: 'Manage team members and their permissions.', image: '/users.png', link: '/users' },
    { id: 5, title: 'Billing', description: 'View invoices and manage your subscription plan.', image: '/billing.png', link: '/billing' },
    { id: 6, title: 'Support', description: 'Get help from our support team or browse the knowledge base.', image: '/support.png', link: '/support' },
  ];

  return (
    <div style={{ width: '1200px', margin: '0 auto', height: '100vh' }}>
      {/* Navigation with no flex-wrap */}
      <nav style={{ display: 'flex', gap: '24px', padding: '16px 0', borderBottom: '1px solid #e0e0e0' }}>
        <a href="/" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Home</a>
        <a href="/dashboard" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Dashboard</a>
        <a href="/analytics" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Analytics</a>
        <a href="/reports" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Reports</a>
        <a href="/settings" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Settings</a>
        <a href="/help" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Help</a>
      </nav>

      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '24px' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
        Welcome back. Here's an overview of your workspace.
      </p>

      {/* 3-column grid with no responsive breakpoints */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
        {defaultItems.map((item) => (
          <div
            key={item.id}
            style={{
              width: '360px',
              padding: '24px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: 'white',
            }}
          >
            {/* Image without max-width: 100% */}
            <img
              src={item.image}
              alt={item.title}
              style={{ width: '360px', height: '200px', objectFit: 'cover' }}
            />
            <h2 style={{ fontSize: '20px', marginTop: '16px' }}>{item.title}</h2>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
              {item.description}
            </p>
            {/* Small touch target */}
            <a
              href={item.link}
              style={{
                fontSize: '14px',
                color: '#1a73e8',
                textDecoration: 'none',
              }}
            >
              View details →
            </a>
          </div>
        ))}
      </div>

      <footer style={{ marginTop: '48px', padding: '16px 0', borderTop: '1px solid #e0e0e0', fontSize: '12px', color: '#999' }}>
        © 2024 Acme Corp. All rights reserved.
      </footer>
    </div>
  );
}

export default DesktopGrid;
