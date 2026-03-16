// PostgreSQL connection for direct database access
const postgresqlUrl = 'postgresql://postgres.gmvmdryoisurvhtdrppb:Azo@2025#Inc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

// Alternative: Use connection object format
const postgresqlConfig = {
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gmvmdryoisurvhtdrppb',
  password: 'Azo@2025#Inc',
  ssl: { rejectUnauthorized: false }
};

export const postgresqlConfig = postgresqlConfig;
export const postgresqlUrl = postgresqlUrl;

// For now, we'll use the regular Supabase client but with a note
// that we need to switch to direct PostgreSQL connection
console.log('PostgreSQL Config:', postgresqlConfig);

// TODO: Implement direct PostgreSQL client
// This would require installing 'pg' package and configuring it
