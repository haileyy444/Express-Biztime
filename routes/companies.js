const express = require("express");
let router = new express.Router();
const ExpressError = require("../expressError");
const slugify = require('slugify');
const db = require("../db");


//get list of compnies {companies: [{code, name}, ...]} 
// result = result of query-> return res.json({companies: result.rows})
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies ORDER BY name`);
        return res.json({"companies": results.rows});
    }
    catch (e) {
        return next(e);
    }
});
// GET /companies/[code] : Return obj of company: {company: {code, name, description}}
// If the company given cannot be found, this should return a 404 status response.
// GET /companies/[code] : Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
//  If the company given cannot be found, this should return a 404 status response.
router.get('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;
        const resultsCompany = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]);
        const resultsInvoice = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);
        
        if (resultsCompany.rows.length ===0 ) {
            throw new ExpressError(`No such company: ${code}`, 404);

        }
        const company = resultsCompany;
        const invoices = resultsInvoice;
        company.invoices = invoices.map(invoice => invoice.id);

        return res.json({"company": company});
    }
    catch (e) {
        return next(e);
    }
});

// POST /companies : Adds a company. Needs to be given JSON 
// like: {code, name, description}
//  Returns obj of new company:  {company: {code, name, description}}
// It might be difficult for customers to make up a customer code themselves when
// making new companies (preferably, they should have no spaces or weird punctuation,
// and should be all lower-case). Fortunately, there’s an NPM library that can help 
// ***slugify***. Read about this, and then change the ***POST /companies*** route so 
//that they don’t provide a code directly, but you make this by using ***slugify()*** on the given name.
router.post('/', async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = slugify(name, {lower: true}); 
        //extra but easier for search using this api
        const result = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({"company": result.rows[0]});
    }
    catch (e) {
        return next(e);
    }
});

// **PUT /companies/[code] :** Edit existing company. Should return 404 if company cannot be found.
// Needs to be given JSON like: `{name, description}` Returns update company object: `{company: {code, name, description}}`

router.put('/:code', async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = req.params.code;
        const result = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code = $3 RETURNING code, name, description', [name, description, code]);
        if (result.rows.length ===0 ) {
            throw new ExpressError(`No such company: ${code}`, 404);

        }
        else {
            return res.json({"company": result.rows[0]});
        }
    }
    catch (e) {
        return next(e);
    }
});


// **DELETE /companies/[code] :** Deletes company. Should return 404 if company cannot be found.
// Returns `{status: "deleted"}`
router.delete("/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        const result = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING code`, [code]);
        if (result.rows.length ===0 ) {
            throw new ExpressError(`No such company: ${code}`, 404);

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