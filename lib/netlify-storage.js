import { getDatabase } from '@netlify/database';

// Keep the existing household API and atomic revision checks while using the
// site's managed Postgres database. No client receives database credentials.
export function makeStorage(getDB = getDatabase) {
  return async (command, ...args) => {
    const { sql } = getDB();
    const [key, value] = args;
    switch (command) {
      case 'INCR': {
        await sql`DELETE FROM together_state WHERE expires_at < NOW()`;
        const [row] = await sql`
          INSERT INTO together_state (key, value, expires_at)
          VALUES (${key}, '1', NOW() + INTERVAL '2 minutes')
          ON CONFLICT (key) DO UPDATE
          SET value = (together_state.value::integer + 1)::text
          RETURNING value`;
        return Number(row.value);
      }
      // Rate entries receive their expiry atomically during INCR.
      case 'EXPIRE': return 1;
      case 'GET': {
        const [row] = await sql`SELECT value FROM together_state WHERE key = ${key}
          AND (expires_at IS NULL OR expires_at > NOW())`;
        return row?.value ?? null;
      }
      case 'SET': {
        if (args[2] !== 'NX') throw new Error('Unsupported storage operation');
        const rows = await sql`INSERT INTO together_state (key, value)
          VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING RETURNING key`;
        return rows.length ? 'OK' : null;
      }
      case 'EVAL': {
        const [, keyCount, stateKey, expected, replacement] = args;
        if (keyCount !== 1) throw new Error('Unsupported storage operation');
        const rows = await sql`UPDATE together_state SET value = ${replacement}
          WHERE key = ${stateKey} AND value = ${expected} RETURNING key`;
        return rows.length;
      }
      default: throw new Error('Unsupported storage operation');
    }
  };
}

export const storage = makeStorage();
