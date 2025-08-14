/*
 Seed many events for given creator IDs using @faker-js/faker.
 Run: node scripts/seed-events.js --creators id1,id2 --count 5000

 Env (optional):
   NEO4J_URI=neo4j://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=admin@12345
*/

const Neode = require("neode");
const { faker } = require("@faker-js/faker");
const neo4j = require("neo4j-driver");

const DEFAULT_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
const DEFAULT_USER = process.env.NEO4J_USER || "neo4j";
const DEFAULT_PASSWORD = process.env.NEO4J_PASSWORD || "admin@12345";

// Optionally hardcode creator IDs here; CLI --creators overrides if provided
let creatorIds = [];

function parseArgs() {
  const args = process.argv.slice(2);
  const countFlagIdx = args.findIndex((a) => a === "--count" || a === "-c");
  const count = countFlagIdx >= 0 ? parseInt(args[countFlagIdx + 1], 10) : 1000;
  const creatorsIdx = args.findIndex((a) => a === "--creators");
  const creatorsCsv = creatorsIdx >= 0 ? args[creatorsIdx + 1] || "" : "";
  const cliCreators = creatorsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const uriIdx = args.findIndex((a) => a === "--uri");
  const uri = uriIdx >= 0 ? args[uriIdx + 1] : DEFAULT_URI;
  const userIdx = args.findIndex((a) => a === "--user");
  const user = userIdx >= 0 ? args[userIdx + 1] : DEFAULT_USER;
  const passIdx = args.findIndex((a) => a === "--password");
  const password = passIdx >= 0 ? args[passIdx + 1] : DEFAULT_PASSWORD;
  const batchIdx = args.findIndex((a) => a === "--batch");
  const batchSize = batchIdx >= 0 ? parseInt(args[batchIdx + 1], 10) : 500;
  const limitIdx = args.findIndex((a) => a === "--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 200;
  return {
    count,
    creators: cliCreators,
    uri,
    user,
    password,
    batchSize,
    limit,
  };
}

function pickCategory() {
  const categories = [
    "Music",
    "Sports",
    "Tech",
    "Business",
    "Education",
    "Art",
    "Health",
    "Food",
    "Travel",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

function randomImage() {
  // Reasonable default image; override in API later if needed
  return faker.image.urlLoremFlickr({ category: "event" });
}

function randomFutureDate() {
  // Return ISO string to avoid passing JS Date objects to Neo4j
  return faker.date.soon({ days: 180 }).toISOString();
}

function buildEventRow(creatorId) {
  const title = `${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Expo`;
  const description = faker.lorem.paragraph();
  const location = `${faker.location.city()}, ${faker.location.country()}`;
  const eventDate = randomFutureDate();
  const price = Number((Math.random() * 200 + 5).toFixed(2));
  const totalTickets = Math.floor(Math.random() * 900) + 100; // 100-1000
  const imageUrl = randomImage();
  // Use ISO strings for temporal fields
  const now = new Date().toISOString();

  return {
    id: faker.string.uuid(),
    title,
    description,
    location,
    eventDate,
    price,
    totalTickets,
    availableTickets: totalTickets,
    category: pickCategory(),
    imageUrl,
    capacity: totalTickets,
    organizerId: creatorId,
    isArchived: false,
    date: now,
    createdAt: now,
    updatedAt: now,
    creatorId,
  };
}

function distributeCounts(total, buckets) {
  // Roughly even distribution across creators
  const counts = new Array(buckets).fill(0);
  for (let i = 0; i < total; i++) counts[i % buckets]++;
  return counts;
}

async function fetchOrganizerIds(neode, limit) {
  // Roles are stored as comma-separated string like "ORGANIZER,ADMIN"; use substring match

  const query = `
    MATCH (u:User)
    WHERE u.roles CONTAINS $role
    RETURN u.id AS id
    ORDER BY rand()
    LIMIT $limit
  `;
  const params = { role: "ORGANIZER", limit: neo4j.int(limit) };
  const res = await neode.readCypher(query, params);
  return res.records.map((rec) => rec.get("id"));
}

async function insertBatch(neode, rows) {
  // Create Event nodes and link to creators
  const query = `
    UNWIND $rows AS row
    MATCH (u:User {id: row.creatorId})
    WITH row, u
    CREATE (e:Event {
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      eventDate: row.eventDate,
      price: row.price,
      totalTickets: row.totalTickets,
      availableTickets: row.availableTickets,
      category: row.category,
      imageUrl: row.imageUrl,
      capacity: row.capacity,
      organizerId: row.organizerId,
      isArchived: row.isArchived,
      date: row.date,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })
    CREATE (u)-[:CREATED]->(e)
    CREATE (e)-[:CREATED_BY]->(u)
  `;
  return neode.writeCypher(query, { rows });
}

async function main() {
  const { count, creators, uri, user, password, batchSize, limit } =
    parseArgs();

  const neode = new Neode(uri, user, password);

  // Prefer CLI creators over hardcoded variable; otherwise auto-fetch organizers
  if (creators && creators.length > 0) creatorIds = creators;
  if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
    creatorIds = await fetchOrganizerIds(neode, limit);
  }

  if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
    console.error(
      "No organizer users found. Seed users with ORGANIZER role first."
    );
    process.exit(1);
  }

  console.log(
    `Seeding ${count} events using ${creatorIds.length} organizer(s) -> ${uri}`
  );

  const rows = [];
  for (let i = 0; i < count; i++) {
    const creatorId = creatorIds[Math.floor(Math.random() * creatorIds.length)];
    rows.push(buildEventRow(creatorId));
  }

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
  console.log(
    `Done. Inserted ${inserted} events in ${(ms / 1000).toFixed(1)}s`
  );

  try {
    await neode.close();
  } catch {}
}

main().catch((err) => {
  console.error("Seeding events failed:", err);
  process.exitCode = 1;
});
