/*
 Seed many users into Neo4j using @faker-js/faker.
 Run: node scripts/seed-users.js --count 10000

 Env (optional):
   NEO4J_URI=neo4j://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=admin@12345
*/

const Neode = require("neode");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");

const DEFAULT_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
const DEFAULT_USER = process.env.NEO4J_USER || "neo4j";
const DEFAULT_PASSWORD = process.env.NEO4J_PASSWORD || "admin@12345";

function parseArgs() {
  const args = process.argv.slice(2);
  const countFlagIdx = args.findIndex((a) => a === "--count" || a === "-c");
  const count =
    countFlagIdx >= 0 ? parseInt(args[countFlagIdx + 1], 10) : 10000;
  const uriIdx = args.findIndex((a) => a === "--uri");
  const uri = uriIdx >= 0 ? args[uriIdx + 1] : DEFAULT_URI;
  const userIdx = args.findIndex((a) => a === "--user");
  const user = userIdx >= 0 ? args[userIdx + 1] : DEFAULT_USER;
  const passIdx = args.findIndex((a) => a === "--password");
  const password = passIdx >= 0 ? args[passIdx + 1] : DEFAULT_PASSWORD;
  const batchIdx = args.findIndex((a) => a === "--batch");
  const batchSize = batchIdx >= 0 ? parseInt(args[batchIdx + 1], 10) : 1000;
  return { count, uri, user, password, batchSize };
}

function makeUsername(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}${Math.floor(Math.random() * 1e6)}`;
}

function getRandomRoles() {
  const all = ["USER", "ORGANIZER", "ADMIN"];
  // Random non-empty subset
  const selected = all.filter(() => Math.random() < 0.5);
  if (selected.length === 0) {
    // ensure at least one role
    selected.push(all[Math.floor(Math.random() * all.length)]);
  }
  // Ensure uniqueness (filter already unique) and return JSON string
  return selected.join(",");
}

async function buildRows(count, hashedPassword) {
  const rows = new Array(count);
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const username = makeUsername(`${firstName}${lastName}`);
    // Use ISO strings to avoid sending JS Date objects (Neo4j requires primitives or arrays)
    const now = new Date().toISOString();

    rows[i] = {
      id: faker.string.uuid(),
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      // In DB this project stores roles as a comma-separated string
      roles: getRandomRoles(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }
  return rows;
}

async function insertBatch(neode, rows) {
  const query = `
    UNWIND $rows AS row
    MERGE (u:User {email: row.email})
    ON CREATE SET
      u.id = row.id,
      u.username = row.username,
      u.firstName = row.firstName,
      u.lastName = row.lastName,
      u.password = row.password,
      u.roles = row.roles,
      u.isActive = row.isActive,
      u.createdAt = row.createdAt,
      u.updatedAt = row.updatedAt
    ON MATCH SET
      u.updatedAt = row.updatedAt
  `;
  return neode.writeCypher(query, { rows });
}

async function main() {
  const { count, uri, user, password, batchSize } = parseArgs();
  console.log(
    `Seeding ${count} users to ${uri} as ${user} (batch=${batchSize})...`
  );

  const neode = new Neode(uri, user, password);

  // Use one hashed password for speed
  const saltRounds = 8;
  const hashedPassword = await bcrypt.hash("Password123!", saltRounds);

  const rows = await buildRows(count, hashedPassword);

  const start = Date.now();
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await insertBatch(neode, batch);
    inserted += batch.length;
    if (inserted % (batchSize * 2) === 0) {
      console.log(`  Inserted ${inserted}/${count}...`);
    }
  }

  const ms = Date.now() - start;
  console.log(`Done. Inserted ${inserted} users in ${(ms / 1000).toFixed(1)}s`);

  // Close driver
  try {
    await neode.close();
  } catch {}
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
});
