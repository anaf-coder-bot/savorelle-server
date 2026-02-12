import { pool } from "../models/db.js";
import { get_product, get_table } from "./customer.js";
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
        const product = (await get_product(id)).msg;

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

export const delete_product = async (id) => {
    try {
        const product = (await get_product(id)).msg;

        if (product.length===0) return {status:400, msg:"Product not found."};
        await pool.query(`
            UPDATE menus
            SET is_deleted = TRUE
            WHERE id = $1;
        `, [id]);
        return {status:200, msg:"Delete success"};
    } catch(error) {
        console.error("Error on delete_product:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const get_staff = async (id) => {
    try {
        let staff;
        if (id)
            staff = (await pool.query(`SELECT id, username, email, role, is_active, created_at FROM staff WHERE id = $1 AND is_deleted = FALSE AND role = 'waiter' ORDER BY username;`, [id])).rows;
        else
            staff = (await pool.query(`SELECT id, username, email, role, is_active, created_at FROM staff WHERE is_deleted = FALSE AND role = 'waiter' ORDER BY username;`)).rows;
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
        return {status: 200, msg:"Staff added.", data: {name, username, pass, email}};
        
    } catch(error) {
        console.error("Error on get_staff:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const edit_staff = async (id, email) => {
    try {
        const staff = (await get_staff(id)).msg;

        if (staff.length===0) return {status:400, msg:"Staff not found."};

        await pool.query(`
           UPDATE staff
           SET email = $1
           WHERE id = $2; 
        `, [email, id]);
        return {status:200, msg:"Edit success", data: {username:staff[0].username, newEmail:email, oldEmail:staff[0].email}};
        
    } catch(error) {
        console.error("Error on edit_staff:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const delete_staff = async (id) => {
    try {
        const staff = (await get_staff(id)).msg;
        if (staff.length===0) return {status:400, msg:"Staff not found."};
        
        await pool.query(`
            UPDATE staff
            SET is_deleted = TRUE
            WHERE id = $1;
        `, [id]);
        return {status:200, msg:"Delete success"};
    } catch(error) {
        console.error("Error on delete_staff:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const add_table = async (table_no, waiter_id) => {
    try {
        const table_no_exist = (await get_table({table_no:table_no})).msg;
        if (table_no_exist.length>0) return {status:400, msg:`Table ${table_no} already exists.`};
        const waiter_exist = (await get_staff(waiter_id)).msg;
        if (waiter_exist.length===0) return {status:400, msg:"Waiter not found."};
    
        await pool.query(`
            INSERT INTO tables (table_no, waiter_id)
            VALUES ($1, $2);
        `, [table_no, waiter_id]);
        return {status:200, msg:"Table added."};
    } catch(error) {
        console.error("Error on add_table:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };

};

export const edit_table = async (id, table_no, waiter_id) => {
    try {
        const table = (await get_table({id:id})).msg;
        if (table.length===0) return {status:400, msg:"Table not found."};
        const table_no_exist = (await get_table({table_no:table_no})).msg;
        if (table_no_exist.length>0 && table_no_exist[0].id!==id) return {status:400, msg:`Table ${table_no} already exists.`};
        const waiter = (await get_staff(waiter_id)).msg;
        if (waiter.length===0) return {status:400, msg:"Waiter not found."};
        
        await pool.query(`
            UPDATE tables
            SET table_no = $1, waiter_id = $2
            WHERE id = $3;    
        `, [table_no, waiter_id, id]);
        return {status:200, msg:"Table edited."};
        
    } catch(error) {
        console.error("Error on edit_table:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const delete_table = async (id) => {
    try {
        const table = (await get_table({id:id})).msg;
        if (table.length===0) return {status:400, msg:"Table not found."};
        await pool.query(`
            UPDATE tables
            SET is_deleted = TRUE
            WHERE id = $1;
        `, [id]);
        return {status:200, msg:"Table deleted."};
    } catch(error) {
        console.error("Error on edit_table:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};