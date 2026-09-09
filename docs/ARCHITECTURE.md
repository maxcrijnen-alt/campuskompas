# CampusKompas

Next.js App Router + strict TypeScript, publicly hosted on Vercel at campuskompas.vercel.app. A separate Sites/Vinext build remains available, but the previous Sites publication failed. Supabase is the authoritative production database, admin identity provider and private photo store. No student accounts.

The default map displays eight original NHL Stenden guide pages as local WebP assets. Attribution links to the publicly available guide copy. The original page geometry is preserved. No prototype coordinates are overlaid on the original plans; schematic route previews remain a separate mode.

Facility information buttons use percentage positions visually matched to the original labelled plans, independently of the routing graph. They open live database opening-hour records, with explicit unknown states and source links. A full list below each floor offers large touch and keyboard targets for facilities without an individually placed marker.

Geometry is a versioned JSON vector model, separate from locations and graph nodes. The routing engine is pure TypeScript. Coordinates are schematic units, never metres. Both nodes and edges carry separate geometry and accessibility verification. Accessible routing requires verified accessibility for the entire path. Unverified ordinary routes are explicitly previews, never turn-by-turn campus guidance.

Public reads use RLS. Anonymous writes pass through bounded HTTP handlers and database transactions for rate limiting and unique votes. Admin requests authenticate with Supabase getUser and a database-owned admin_profiles membership. No privileged key reaches the client. Files remain in a private bucket and are served only for approved gems or authenticated moderators.

Without database configuration, sourced campus data remains searchable; writes fail honestly with a friendly unavailable state. Once configured, a database failure produces an empty unavailable state, never a mock fallback. There is no simulated successful submission or admin bypass. Live tests use explicitly configured administrator credentials and remove their temporary QA records.
