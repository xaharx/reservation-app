/**
 * Creates (or updates the password of) an admin account so someone can
 * actually log in to the Admin Panel — there's no signup flow by design,
 * admin accounts are provisioned this way.
 *
 * Usage (all via env vars so the password never ends up in shell history
 * as a plain CLI argument):
 *   ADMIN_EMAIL=admin@oradenuit.com \
 *   ADMIN_PASSWORD='replace_with_a_strong_password' \
 *   ADMIN_FIRST_NAME=Ora \
 *   ADMIN_LAST_NAME=Admin \
 *   ADMIN_ROLE=SUPER_ADMIN \
 *   node scripts/seed-admin.js
 *
 * ADMIN_FIRST_NAME/ADMIN_LAST_NAME/ADMIN_ROLE are optional (default "Admin"/
 * "User"/"SUPER_ADMIN"). Re-running with the same ADMIN_EMAIL updates that
 * account's name/role/password instead of creating a duplicate.
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR'];

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const role = process.env.ADMIN_ROLE || 'SUPER_ADMIN';
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`ADMIN_ROLE must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';
  const passwordHash = await bcrypt.hash(password, 12);

  const adminUser = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, firstName, lastName, role, isActive: true, deletedAt: null },
    create: { email: email.toLowerCase(), passwordHash, firstName, lastName, role },
  });

  console.log(`Admin user ready: ${adminUser.email} (role: ${adminUser.role}, id: ${adminUser.id})`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
