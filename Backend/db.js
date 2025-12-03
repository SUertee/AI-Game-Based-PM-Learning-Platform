const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://postgres.eaknjohaqfrhxygadlfb:cAp_stOnE%40soft3888@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false, // this is enough
  },
  application_name: 'soft3888-backend', // optional but recommended
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
