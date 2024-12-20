const express = require("express");
let router = new express.Router();
const ExpressError = require("../expressError");

const db = require("../db");

// Add a table for “industries”, where there is a ***code*** and an ***industry*** field (for example: “acct” and “Accounting”).
// Add a table that allows an industry to be connected to several companies and to have a company belong to several industries.
// Add some sample data (by hand in ***psql*** is fine).
// Change this route:
// - when viewing details for a company, you can see the names of the industries for that company
// Add routes for:
// - adding an industry
// - listing all industries, which should show the company code(s) for that industry
// - associating an industry to a company


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT i.code, i.industry, JSON_AGG(ci.company_code) AS companies
             FROM industries i
             LEFT JOIN company_industries ci ON i.code = ci.industry_code
             GROUP BY i.code`);
        return res.json({"industries": results.rows});
    }
    catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        let {code, industry} = req.body;

        const result = await db.query('INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);

        return res.status(201).json({"industry": result.rows[0]});
    }
    catch (e) {
        return next(e);
    }
});

//this is all back end tables that are created as an intermediate link to both of them
app.post('/company', async (req, res, next) => {
    try {
        const { company_code, industry_code } = req.body;
        const result = await db.query(
            `INSERT INTO company_industries (company_code, industry_code) 
             VALUES ($1, $2) 
             RETURNING company_code, industry_code`, 
            [company_code, industry_code]
        );
        return res.status(201).json({ association: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;