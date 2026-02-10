import { pool } from "./db.js";

export const initalizeTable = async () => {
    try {
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
    
        await pool.query(`
            CREATE TABLE IF NOT EXISTS menus (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(20) NOT NULL,
                description VARCHAR(50),
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(10) NOT NULL CHECK ( category IN ('starters', 'main dishes', 'desserts', 'drinks')),
                img TEXT NOT NULL,
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Database created.")
    } catch(error) {
        console.error("Error creating database:",error.message);
    };
};