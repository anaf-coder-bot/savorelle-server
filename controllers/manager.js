import { pool } from "../models/db.js";
import { get_product } from "./customer.js";

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
        const product = (await get_product(id)).product;

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