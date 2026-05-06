export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");

  const dataDir = path.join(process.cwd(), "prisma", "pglite-data");
  const markerFile = path.join(dataDir, ".schema-applied");

  if (fs.existsSync(markerFile)) return;

  const sqlPath = path.join(process.cwd(), "prisma", "schema.sql");
  if (!fs.existsSync(sqlPath)) {
    console.warn("[PGlite] schema.sql not found — skipping schema setup.");
    return;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dataDir);
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await pg.exec(sql);
  await pg.close();

  fs.writeFileSync(markerFile, new Date().toISOString());
  console.log("[PGlite] Schema applied to local database.");
}
