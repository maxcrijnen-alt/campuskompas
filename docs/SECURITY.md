# Security verification

- Exposed tables have RLS; only approved campus content is public.
- Public users have no mutation policy. Admin policies require an actual row in admin_profiles, never user_metadata.
- Signup trigger consumes a short-lived permit. No permit means no Auth registration, including direct requests to GoTrue. Permits do not grant app permissions.
- Internal server credential and rate-limit tables deliberately use default-deny RLS. Supabase's informational “RLS enabled, no policy” notices on these tables are expected.
- Storage is private, random names, 3 MB maximum, JPEG/PNG/WebP validation; pending photos require administrator authorization.
- API writes validate origin against the actual proxy host, stream-bound request limits and Zod. SQL calls are parameterized through Supabase.
- Rate limits and votes are transactional; unique (gem_id, device_hash) prevents repeat votes.
- No secret appears in client props or NEXT_PUBLIC variables. The server gateway requires a 48-byte random credential; the database contains its SHA-256 hash only. It does not return or expose the Supabase servicekey.
- Public reads, unauthorized mutation attempts, photo submission/moderation and duplicate votes are tested against the live project.

## Operations

Run Supabase security/performance advisors after schema changes. Configure leaked-password protection if your Supabase plan supports it: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Review image retention, backups, data processing agreements and admin MFA before institutional launch. These are operational decisions, not claims that the application has been certified.

The map is not an emergency evacuation or accessibility certification tool. Schematic routing is expressly unverified. Physical validation is a separate release gate.
