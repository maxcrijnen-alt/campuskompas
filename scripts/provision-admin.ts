import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { serviceDb } from '../lib/server/supabase';
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m) process.env[m[1]] = m[2];
}
const email = process.argv[2];
if (!email || !email.includes('@')) throw Error('Provide administrator email');
const password = randomBytes(24).toString('base64url') + 'aA1!';
const { data, error } = await serviceDb().auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { campus_admin_provisioned: true },
});
if (error || !data.user) throw Error(error?.message ?? 'Provision failed');
writeFileSync(
  'admin-access.txt',
  `CampusKompas administrator\nLogin: http://127.0.0.1:3000/admin\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. Do not commit or share. No email was sent.\n`,
);
writeFileSync(
  '.env.test.local',
  `TEST_ADMIN_EMAIL=${email}\nTEST_ADMIN_PASSWORD=${password}\nTEST_ADMIN_ID=${data.user.id}\n`,
);
console.log(
  'Created administrator identity: ' +
    data.user.id +
    '. Credentials written to ignored admin-access.txt.',
);
