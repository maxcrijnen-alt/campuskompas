import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="page-wrap">
      <div className="empty-state">
        <h1>Even de weg kwijt? / Lost your way?</h1>
        <p>Deze pagina bestaat niet. / This page does not exist.</p>
        <Link className="text-link" href="/">
          Terug naar de kaart / Back to the map →
        </Link>
      </div>
    </main>
  );
}
