import { pool } from "./db.js";
import bcrypt from "bcrypt";

export const initalizeTable = async () => {
    try {
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
    
        await pool.query(`
            CREATE TABLE IF NOT EXISTS menus (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(50) NOT NULL,
                description VARCHAR(100),
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(20) NOT NULL CHECK ( category IN ('starters', 'main dishes', 'desserts', 'drinks')),
                img TEXT NOT NULL,
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS staff (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(20) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT NOT NULL,
                role VARCHAR(10) NOT NULL CHECK ( role IN ('manager', 'waiter', 'kitchen', 'cashier') ),
                is_active BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tables (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                table_no VARCHAR(4) UNIQUE NOT NULL,
                waiter_id UUID REFERENCES staff(id) ON DELETE SET NULL,
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        
        // INSERT DEFAULT STAFF
        const already_in = (await pool.query(`SELECT * FROM staff WHERE role = 'manager'`)).rows
        if (already_in.length===0) {
            try {
                const manager_username = process.env.DEFAULT_MANAGER_USERNAME;
                const manager_pass = process.env.DEFAULT_MANAGER_PASS;
                const hash_manager_pass = await bcrypt.hash(manager_pass, 10);
                const manager_email = process.env.DEFAULT_MANAGER_EMAIL;
                const kitchen_username = process.env.DEFAULT_KITCHEN_USERNAME;
                const kitchen_pass = process.env.DEFAULT_KITCHEN_PASS;
                const hash_kitchen_pass = await bcrypt.hash(kitchen_pass, 10);
                const kitchen_emai = process.env.DEFAULT_KITCHEN_EMAIL;
                const cashier_username = process.env.DEFAULT_CASHIER_USERNAME;
                const cashier_pass = process.env.DEFAULT_CASHIER_PASS;
                const hash_cashier_pass = await bcrypt.hash(cashier_pass, 10);
                const cashier_email = process.env.DEFAULT_CASHIER_EMAIL;
    
                await pool.query(`
                    INSERT INTO staff (username, password, email, role)
                    VALUES 
                            ($1, $2, $3, 'manager'),
                            ($4, $5, $6, 'kitchen'),
                            ($7, $8, $9, 'cashier');
                `, [manager_username, hash_manager_pass, manager_email, kitchen_username, hash_kitchen_pass, kitchen_emai, cashier_username, hash_cashier_pass, cashier_email]);
            } catch(error) {
                console.error("Error on adding default staff:",error.message);
            };
        };

        console.log("Database created.")
    } catch(error) {
        console.error("Error creating database:",error.message);
    };
};