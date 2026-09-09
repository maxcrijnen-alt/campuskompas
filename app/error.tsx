'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-wrap">
      <div className="empty-state">
        <h1>Dat ging even mis / Something went wrong</h1>
        <p>Probeer het opnieuw. / Please try again.</p>
        <button className="primary-button" onClick={reset}>
          Opnieuw proberen / Retry
        </button>
      </div>
    </main>
  );
}
