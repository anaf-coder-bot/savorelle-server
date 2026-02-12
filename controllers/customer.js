import { pool } from "../models/db.js";

export const get_product = async (id) => {
    try {
        let product;
        if (id)
            product = (await pool.query(`SELECT * FROM menus WHERE id = $1 AND is_deleted = FALSE;`, [id])).rows;
        else
            product = (await pool.query(`SELECT * FROM menus WHERE is_deleted = FALSE ORDER BY CASE category WHEN 'starters' THEN 1 WHEN 'main dishes' THEN 2 WHEN 'desserts' THEN 3 WHEN 'drinks' THEN 4 END, name`)).rows;
        return {status:200, msg:product};
    } catch(error) {
        console.error("Error on get_product:",error.message);
        return {status:500, msg: "Something went wrong, try again."};
    };
};