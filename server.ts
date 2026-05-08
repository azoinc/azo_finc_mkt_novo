import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database configuration from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_URL ? undefined : "localhost",
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "5432"),
  connectionString: process.env.DATABASE_URL || undefined,
  ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" || process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : undefined
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Generic query endpoint to replace Supabase client
  app.post("/api/query", async (req, res) => {
    try {
      const { table, select, filters, inFilters, limit, order } = req.body;
      
      let query = `SELECT ${select || '*'} FROM ${table} WHERE 1=1`;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters) {
        for (const filter of filters) {
          const { column, operator, value } = filter;
          if (operator === 'eq') {
            query += ` AND "${column}" = $${paramIndex}`;
            values.push(value);
            paramIndex++;
          } else if (operator === 'gte') {
            query += ` AND "${column}" >= $${paramIndex}`;
            values.push(value);
            paramIndex++;
          } else if (operator === 'lte') {
            query += ` AND "${column}" <= $${paramIndex}`;
            values.push(value);
            paramIndex++;
          }
        }
      }

      if (inFilters) {
        for (const filter of inFilters) {
          const { column, values: inValues } = filter;
          if (inValues && inValues.length > 0) {
            const placeholders = inValues.map(() => `$${paramIndex++}`).join(', ');
            query += ` AND "${column}" IN (${placeholders})`;
            values.push(...inValues);
          } else {
            query += ` AND 1=0`;
          }
        }
      }

      if (order) {
        const { column, ascending } = order;
        query += ` ORDER BY "${column}" ${ascending ? 'ASC' : 'DESC'}`;
      }

      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(limit);
        paramIndex++;
      } else {
        query += ` LIMIT 10000`; // Default limit for safety
      }

      const result = await pool.query(query, values);
      res.json({ data: result.rows, error: null });
    } catch (error: any) {
      console.error("Database query error:", error);
      res.status(500).json({ data: null, error: { message: error.message } });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
