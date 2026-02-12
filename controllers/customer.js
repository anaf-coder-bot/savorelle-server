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

export const get_table = async ({id, table_no} = {}) => {
    try {
        let table;
        if (id) 
            table = (await pool.query(`SELECT * FROM tables WHERE id = $1 AND is_deleted = FALSE;`, [id])).rows;
        else if (table_no)
            table = (await pool.query(`SELECT * FROM tables WHERE table_no = $1 AND is_deleted = FALSE;`, [table_no])).rows;
        else
            table = (await pool.query(`SELECT t.*, s.username as waiter_username FROM tables t JOIN staff s ON t.waiter_id = s.id WHERE t.is_deleted = FALSE ORDER BY t.table_no;`)).rows;
        return {status:200, msg:table};
    } catch(error) {
        console.error("Error on get_table:",error.message);
        return {status:500, msg: "Something went wrong, try again"};
    };
};

export const get_all_staff = async () => {
    try {
        const staff = (await pool.query(`SELECT id, username FROM staff WHERE is_deleted = FALSE AND role = 'waiter';`)).rows;
        return {status:200, msg:staff};
    } catch(error) {
        console.error("Error on get_staff:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};