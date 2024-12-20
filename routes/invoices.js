const express = require("express");
let router = new express.Router();
const ExpressError = require("../expressError");

const db = require("../db");


//GET /invoices : Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`);
        return res.json({"invoices": results.rows});
    }
    catch (e) {
        return next(e);
    }
});
// GET /invoices/[id] : Returns obj on given invoice.
// If invoice cannot be found, returns 404. Returns 
// {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get('/:id', async (req, res, next) => {
    try {
        let id = req.params.id;
        const result = await db.query(`SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id=$1`, [id]);
        
        if (result.rows.length ===0 ) {
            throw new ExpressError(`No such invoice: ${id}`, 404);

        }
        const data = result.rows[0];
        const invoice = {
            id: data.id, 
            company: {
                code: data.comp_code, 
                name: data.name, 
                description: data.description}, 
            amt: data.amt,
            paid: data.paid, 
            add_data: data.add_date, 
            paid_date: data.paid_date,
        };
        return res.json({"invoice" : invoice});
    }
    catch (e) {
        return next(e);
    }
});

// POST /invoices : Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async (req, res, next) => {
    try {
        let {comp_code, amt} = req.body;

        const result = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);

        return res.status(201).json({"invoice": result.rows[0]});
    }
    catch (e) {
        return next(e);
    }
});

// PUT /invoices/[id] : Updates an invoice. If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt} 
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
// PUT /invoices/[id] : Updates an invoice. If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt, paid}
// • If paying unpaid invoice: sets paid_date to today
// • If un-paying: sets paid_date to null
// • Else: keep current paid_date
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put('/:id', async (req, res, next) => {
    try {
        let {amt, paid} = req.body;
        let id = req.params.id;
        let paidDate = null;

        const unPayResult = await db.query('SELECT paid FROM invoices WHERE id = $1', [id]);
        if (unPayResult.rows.length ===0 ) {
            throw new ExpressError(`No invoice found for: ${id}`, 404);

        }
        
        const currPaidDate = unPayResult.rows[0].paid_date;
        if (!currPaidDate && paid) {
            paidDate = new Date();
        }
        else if (!paid) {
            paidDate = null;
        }
        else {
            paidDate = currPaidDate;
        }
        const finalResult = await db.query(`UPDATE invoices SEt amt=$1, paid=$2, paid_date=$3, WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paidDate, id]);
        return res.json({"invoices": finalResult.rows[0]});
    }
    catch (e) {
        return next(e);
    }
});


// DELETE /invoices/[id] : Deletes an invoice.If invoice cannot be found, returns a 404. 
// Returns: {status: "deleted"} Also, one route from the previous part should be updated:
router.delete("/:id", async (req, res, next) => {
    try {
        let id = req.params.id;
        const result = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [code]);
        if (result.rows.length ===0 ) {
            throw new ExpressError(`No such invoice: ${id}`, 404);

        }
        else {
            return res.json({"status" : "Deleted"});
        }
    }
    catch (e) {
        return next(e);
    }
});

module.exports = router;