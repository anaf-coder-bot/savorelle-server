import { pool } from "../models/db.js";
import { get_product } from "./customer.js";
import bcrypt from "bcrypt";

export const add_poduct = async (name, description, price, img, category) => {
    try {
        await pool.query(`
           INSERT INTO menus (name, description, price, category, img)
           VALUES ($1, $2, $3, $4, $5); 
        `, [name, description, price, category, img]);
        return {status: 200, msg: "Product added."};
    } catch (error) {
        console.error("Error on add_product:",error.message);
        return {status:500, msg: "Something went wrong, try again."};
    };
};

export const edit_product = async (id, name, description, price, img, category) => {
    try {
        const product = (await get_product(id)).msg[0];

        if (product.length===0) return {status:400, msg: "Product not found."};
        await pool.query(`
            UPDATE menus
            SET name = $1, description = $2, price = $3, img = $4, category = $5
            WHERE id = $6;
        `, [name, description, price, img, category, id]);
        return {status:200, msg:"Edit Success."};
    } catch(error) {
        console.error("Error on edit_product:",error.message);
        return {status:500, msg: "Something went wrong, try again."};
    };
};

export const get_staff = async (id) => {
    try {
        let staff;
        if (id)
            staff = (await pool.query(`SELECT id, username, email, role, is_active, created_at FROM staff WHERE id = $1 AND is_deleted = FALSE AND role = 'waiter' ORDER BY username;`, [id])).rows;
        else
            staff = (await pool.query(`SELECT id, username, email, role, is_active, created_at FROM staff WHERE is_delete = FALSE AND role = 'waiter' ORDER BY username;`)).rows;
        return {status:200, msg:staff};
    } catch(error) {
        console.error("Error on get_staff", error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

const generate_username = (data) => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${data.toLowerCase()}-${suffix}`;
};

const generate_pass = () => String(Math.floor(100000 + Math.random() * 900000));

export const add_staff = async (name, email) => {
    try {
        const username = generate_username(name);
        const pass = generate_pass();
        const hash_pass = await bcrypt.hash(pass, 10);

        await pool.query(`
           INSERT INTO staff (username, password, email, role)
           VALUES ($1, $2, $3, 'waiter'); 
        `, [username, hash_pass, email]);
        return {status: 200, msg:"Staff added."};
        
    } catch(error) {
        console.error("Error on get_staff:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};