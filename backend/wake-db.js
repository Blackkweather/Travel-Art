const { Pool } = require('pg');

async function wakeDatabase() {
  console.log('🔄 Waking up Neon database...\n');
  
  // SECURITY: Use environment variable instead of hardcoded credentials
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or NEON_DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 30000, // 30 seconds
    idleTimeoutMillis: 0,
  });

  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`Attempt ${4 - retries}/3...`);
      const client = await pool.connect();
      console.log('✅ Database is awake!');
      
      const result = await client.query('SELECT NOW() as time');
      console.log('✅ Query successful:', result.rows[0].time);
      
      client.release();
      break;
    } catch (error) {
      retries--;
      console.log(`❌ Attempt failed: ${error.message}`);
      if (retries > 0) {
        console.log('⏳ Waiting 10 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
  
  await pool.end();
}

wakeDatabase();