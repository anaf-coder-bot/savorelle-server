import { pool } from "../models/db.js";

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