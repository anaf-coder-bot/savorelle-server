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

export const get_product = async (id) => {
    try {
        let product;
        if (id)
            product = (await pool.query(`SELECT * FROM menus WHERE id = $1`, [id])).rows[0];
        else
            product = (await pool.query(`SELECT * FROM menus ORDER BY CASE category WHEN 'starters' THEN 1 WHEN 'main dishes' THEN 2 WHEN 'desserts' THEN 3 WHEN 'drinks' THEN 4 END`)).rows;
        return {product};
    } catch(error) {
        console.error("Error on get_product:",error.message);
        return {status:500, msg: "Something went wrong, try again."};
    };
};