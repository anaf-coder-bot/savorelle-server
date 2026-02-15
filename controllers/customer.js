import { pool } from "../models/db.js";
import { get_tx_ref } from "../service/chapa.js";

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

export const add_order = async (cart, table_id, name, email, phone) => {
    try {
        let total = 0;

        const table = (await get_table({id:table_id})).msg;
        if (table.length===0) return {status:400, msg:"Table not found."};
        const FIRST_FEE = process.env.FIRST_FEE;
        const LAST_FEE = process.env.LAST_FEE;
        const first_tx = await get_tx_ref();
        const last_tx = await get_tx_ref();
        const s_cart = [];
        for (const c of cart) {
            const { id, quantity } = c;
            const product = (await get_product(id)).msg;
            if (product.length===0) return {status:400, msg:"Menu not found."};
            total += (Number(product[0].price) * Number(quantity));  
            s_cart.push({...c, price:Number(product[0].price) * Number(quantity)});   
        };
        
        const order = (await pool.query(`
            INSERT INTO orders(customer_name, customer_email, customer_phone, table_id, waiter_id, price, first_price, first_tx_ref, last_price, last_tx_ref)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;
        `, [name, email, phone, table[0].id, table[0].waiter_id, total, (total*Number(FIRST_FEE)), first_tx, (total*LAST_FEE), last_tx])).rows[0];
        
        for (const c of s_cart) {
            const { id, quantity, price } = c;
            await pool.query(`
                INSERT INTO order_items (order_id, menu_id, quantity, price)
                VALUES ($1, $2, $3, $4);
            `, [order.id, id, quantity, price]);
        };
        return {status:200, msg:{first_tx, first_price:total*FIRST_FEE}};
    } catch(error) {
        console.error("Error on start_payment:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const get_order = async ({ id, first_tx_ref, last_tx_ref }) => {
    try {
        let order;
        if (id)
            order = (await pool.query(`SELECT o.*, w.username AS waiter_name FROM orders o JOIN staff w ON w.id = o.waiter_id WHERE o.id = $1`, [id])).rows;
        else if (first_tx_ref)
            order = (await pool.query(`SELECT o.*, w.username AS waiter_name FROM orders o JOIN staff w ON w.id = o.waiter_id WHERE o.first_tx_ref = $1`, [first_tx_ref])).rows;
        else if (last_tx_ref)
            order = (await pool.query(`SELECT o.*, w.username AS waiter_name FROM orders o JOIN staff w ON w.id = o.waiter_id WHERE o.last_tx_ref = $1`, [last_tx_ref])).rows;
        if (order.length>0) {
            const items = (await pool.query(`SELECT i.*, m.name FROM order_items i JOIN menus m ON m.id = i.menu_id WHERE i.order_id = $1`, [order[0].id])).rows;
            order = [{...order[0], items}];
        };
        return {status:200, msg:order};
    } catch(error) {
        console.error("Error on get_order:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const do_fail_order = async (tx_ref, round) => {
    try {
        if (!round || round === "first") {
            const order = (await get_order({first_tx_ref:tx_ref})).msg;
            if (order.length===0)
                return {status:400, msg:"Order not found"};
            if (order[0].first_status!=="pending") return {status:403, msg:"Payment is not on pending."};
            await pool.query(`
                UPDATE orders
                SET first_status = 'failed', first_at = NOW(), first_failed = first_failed + 1
                WHERE first_tx_ref = $1;
            `, [tx_ref]);
        } else if (round === "last") {
            const order = (await get_order({last_tx_ref:tx_ref})).msg;
            if (order.length===0)
                return {status:400, msg:"Order not found."};
            if (order[0].last_status!=="pending") return {status:403, msg:"Payment is not on pending."};
            await pool.query(`
                UPDATE orders
                SET last_status = 'failed', last_at = NOW(), last_failed = last_failed + 1
                WHERE last_tx_ref = $1;
            `, [tx_ref]);
        };
        return {status:200, msg:"Payment failed."};
    } catch(error) {
        console.error("Error on do_fail_order:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const do_success_order = async (tx_ref, round, amount) => {
    try {
        let order;
        if (!round || round === "first") {
            order = (await get_order({first_tx_ref:tx_ref})).msg;
            if (order.length===0)
                return {status:400, msg:"Order not found."};
            if (order[0].first_status!=="pending") return {status:403, msg:"Payment is not on pending."};
    
            if (Number(amount)!==Number(order[0].first_price)) {
                do_fail_order(tx_ref);
                return {status:403, msg:"Payment amount is not right."};
            };
            const time = (await pool.query(`
                UPDATE orders
                SET first_status = 'paid', first_at = NOW()
                WHERE first_tx_ref = $1 RETURNING first_at;
            `, [tx_ref])).rows;
            order[0]["first_at"] = time[0].first_at;
        } else if (round === "last") {
            order = (await get_order({last_tx_ref:tx_ref})).msg;
            if (order.length===0)
                return {status:400, msg:"Order not found."};
            if (order[0].last_status!=="pending") return {status:403, msg:"Payment is not on pending."};
            if (order[0].status!=='paying') return {status:403, msg:"Order is not served yet."};
            const time = (await pool.query(`
                UPDATE orders
                SET last_status = 'paid', last_at = NOW(), status = 'done'
                WHERE last_tx_ref = $1 RETURNING last_at;
            `, [tx_ref])).rows;
            order[0]['last_at'] = time[0].last_at;
        };
        return {status:200, msg:"Payment success.", order:order[0]};
    } catch(error) {
        console.error("Error on do_success_order:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const retry_payment = async (id, round) => {
    try {
        const order = (await get_order({id:id})).msg;
        if (order.length===0) return {status:400, msg:"Order not found."};
        const today = new Date();
        today.setHours(0,0,0,0);
        const orderDate = new Date(order[0].created_at);
        if (round==="first" && orderDate <= today) return {status:403, msg:"Payment is cancel, try as new."};
        const tx_ref = await get_tx_ref();
        if (round==="first") {
            if (order[0].first_status!=="failed") return {status:403, msg:"Payment is not failed yet."};
            await pool.query(`
                UPDATE orders
                SET first_status = 'pending', first_tx_ref = $1
                WHERE id = $2;
            `, [tx_ref, id]);
        } else if (round==="last") {
            if (order[0].last_status!=="failed") return {status:403, msg:"Payment is not failed yet."};
            await pool.query(`
                UPDATE orders
                SET last_status = 'pending', last_tx_ref = $1
                WHERE id = $2;
            `, [tx_ref, id]);
        };
        return {status:200, data:{tx_ref, name:order[0].customer_name, email:order[0].customer_email, phone:order[0].customer_phone, amount:order[0][round==="first"?"first_price":"last_price"]}};
    } catch(error) {
        console.error("Error on retry_payment:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};