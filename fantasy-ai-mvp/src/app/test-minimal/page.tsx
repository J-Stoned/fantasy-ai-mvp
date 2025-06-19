export default function TestMinimal() {
  return (
    <div>
      <h1>Minimal Test Page</h1>
      <p>If you see this, Next.js is working!</p>
      <p>Database URL: {process.env.DATABASE_URL ? 'Set' : 'Not set'}</p>
      <p>Environment: {process.env.NODE_ENV}</p>
    </div>
  );
}