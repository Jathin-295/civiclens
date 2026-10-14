import { resetDb } from './db.js';

console.log('Seeding CivicLens AI Database...');
const seeded = resetDb();
console.log(`Successfully seeded ${seeded.length} reproducible civic barrier issues in Hitec City, Hyderabad:`);
for (const issue of seeded) {
  console.log(`- [${issue.id}] ${issue.title} (${issue.category}, ${issue.severity.toUpperCase()}, Status: ${issue.status})`);
}
console.log('Database initialization complete.');
