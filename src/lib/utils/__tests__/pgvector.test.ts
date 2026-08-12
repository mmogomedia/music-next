import { toVectorLiteral } from '../pgvector';

/**
 * Guards the Prisma 7 driver-adapter regression.
 *
 * Passing a JS `number[]` straight into a `$queryRaw` template makes
 * `@prisma/adapter-pg` serialise it as a PostgreSQL array literal
 * (`{"0.1","0.2"}`), which pgvector rejects with `22P02`. Neither `tsc` nor
 * `next build` can see this — the query is a template literal — so this test is
 * the only automated thing standing between a refactor and every embedding
 * write / semantic search failing in production.
 */
describe('toVectorLiteral', () => {
  it('emits pgvector bracket syntax, not a Postgres array literal', () => {
    const literal = toVectorLiteral([0.1, 0.2, 0.3]);
    expect(literal).toBe('[0.1,0.2,0.3]');
    // The exact failure mode that broke under the driver adapter:
    expect(literal).not.toContain('{');
    expect(literal).not.toContain('"');
  });

  it('preserves negative and exponent-form values', () => {
    expect(toVectorLiteral([-0.5, 1e-7])).toBe('[-0.5,1e-7]');
  });

  it('handles a full 1536-dim embedding', () => {
    const v = Array.from({ length: 1536 }, (_, i) => (i + 0.5) / 10000);
    const literal = toVectorLiteral(v);
    expect(literal.startsWith('[')).toBe(true);
    expect(literal.endsWith(']')).toBe(true);
    expect(literal.split(',')).toHaveLength(1536);
  });

  it('rejects non-finite values instead of emitting null', () => {
    // JSON.stringify would turn these into `null`, which Postgres rejects with
    // a confusing parse error far from the real cause.
    expect(() => toVectorLiteral([1, NaN])).toThrow(TypeError);
    expect(() => toVectorLiteral([Infinity])).toThrow(TypeError);
  });
});
