const { Pool } = require('pg');

// Test database connection
async function testDatabase() {
  console.log('🔍 Testing database connection...\n');
  
  const connectionString = 'postgresql://neondb_owner:npg_aNgJr37yWclX@ep-dry-cake-adpdwpe8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Check if users table exists
    try {
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `);
      
      if (tableCheck.rows.length > 0) {
        console.log('✅ Users table exists');
        
        // Check if there are any users
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Users in database: ${userCount.rows[0].count}`);
      } else {
        console.log('⚠️ Users table does not exist - migrations needed');
      }
    } catch (tableError) {
      console.log('⚠️ Could not check tables:', tableError.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await pool.end();
  }
}

testDatabase();