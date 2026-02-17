import { pool } from "../models/db.js";


export const get_order = async (id) => {
    try {
        let order;
        const order_f = [];
        if (id)
            order = (await pool.query(`
                SELECT o.id, o.customer_name, t.table_no, o.price, o.status
                FROM orders o
                JOIN tables t ON t.id = o.table_id
                WHERE o.id = $1 AND o.first_status <> 'pending' AND o.created_at >= CURRENT_DATE;
            `, [id])).rows;
        else
            order = (await pool.query(`
                SELECT o.id, o.customer_name, t.table_no, o.price, o.status
                FROM orders o
                JOIN tables t ON t.id = o.table_id
                WHERE o.first_status <> 'pending' AND o.created_at >= CURRENT_DATE;
            `)).rows;
        
        for (const o of order) {
            const items = (await pool.query(`
                    SELECT m.name, i.quantity
                    FROM order_items i
                    JOIN menus m ON m.id = i.menu_id
                    WHERE i.order_id = $1;
                `, [o.id])).rows;
            order_f.push({...o, items});
        };

        return { status:200, order:order_f };

    } catch(error) {
        console.error("Error on waiter: get_order:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};