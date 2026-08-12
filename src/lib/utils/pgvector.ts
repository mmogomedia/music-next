/**
 * pgvector parameter helpers.
 *
 * Why this exists
 * ---------------
 * Prisma 5 ran raw queries through the Rust query engine, which serialised a JS
 * `number[]` parameter as a PostgreSQL `double precision[]`. pgvector defines a
 * cast from `double precision[]` to `vector`, so `${embedding}::vector(1536)`
 * worked.
 *
 * Prisma 7 has no built-in query engine — raw parameters go through the driver
 * adapter (`@prisma/adapter-pg` → node-postgres). `pg` serialises a JS array as
 * a PostgreSQL *array literal with quoted elements*:
 *
 *     {"0.0005","0.0015",...}
 *
 * pgvector's text input format uses square brackets, not braces:
 *
 *     [0.0005,0.0015,...]
 *
 * so the cast fails at runtime with `22P02 invalid input syntax for type vector`.
 * Nothing catches this at compile time — the query is a template literal, so
 * `tsc` and `next build` both stay green while every embedding write and every
 * semantic search fails in production.
 *
 * Passing the vector as a pgvector text literal is the portable fix: it works
 * identically on Prisma 5 and 7, and on any driver adapter.
 */

/**
 * Convert an embedding to a pgvector text literal (`"[0.1,0.2,...]"`).
 *
 * Always interpolate the RESULT as a query parameter and cast it explicitly,
 * e.g. ``prisma.$executeRaw`... ${toVectorLiteral(v)}::vector(1536) ...` ``.
 * The value stays a bound parameter, so this is not a SQL-injection surface.
 */
export function toVectorLiteral(embedding: number[]): string {
  // JSON.stringify of a number[] is exactly pgvector's input format.
  // Guard against non-finite values, which would serialise as `null` and make
  // Postgres reject the whole vector with a confusing parse error.
  for (const n of embedding) {
    if (!Number.isFinite(n)) {
      throw new TypeError(
        `toVectorLiteral: embedding contains a non-finite value (${n})`
      );
    }
  }
  return JSON.stringify(embedding);
}
