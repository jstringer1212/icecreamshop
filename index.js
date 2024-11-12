const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://uglie:wtffishster96@localhost/ice_cream_flavors_db');
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

// GET /api/flavors - Returns an array of flavors
app.get("/api/flavors", async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

// GET /api/flavors/:id - Returns a single flavor
app.get("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors WHERE id = ${req.params.id}`;
        const response = await client.query(SQL);
        if (response.rows.length === 0) return res.status(404).send("Flavor not found");
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST /api/flavors - Creates a new flavor
app.post("/api/flavors", async (req, res, next) => {
    try {
        const { txt, is_favorite } = req.body;
        const SQL = `
            INSERT INTO flavors (txt, is_favorite) 
            VALUES ('${txt}', ${is_favorite || false}) 
            RETURNING *
        `;
        const response = await client.query(SQL);
        res.status(201).send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/flavors/:id - Deletes a flavor
app.delete("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = `DELETE FROM flavors WHERE id = ${req.params.id}`;
        await client.query(SQL);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// PUT /api/flavors/:id - Updates a flavor
app.put("/api/flavors/:id", async (req, res, next) => {
    try {
        const { txt, is_favorite } = req.body;
        const SQL = `
            UPDATE flavors 
            SET txt = '${txt}', is_favorite = ${is_favorite}, updated_at = now()
            WHERE id = ${req.params.id} 
            RETURNING *
        `;
        const response = await client.query(SQL);
        if (response.rows.length === 0) return res.status(404).send("Flavor not found");
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

const init = async () => {
    await client.connect();
    console.log("Connected to database");

    const SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors (
            id SERIAL PRIMARY KEY,
            txt VARCHAR(25) NOT NULL,
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;

    await client.query(SQL);
    console.log("Tables created");

    const seedData = `
        INSERT INTO flavors (txt, is_favorite) VALUES
        ('Vanilla', true),
        ('Chocolate', false),
        ('Strawberry', false),
        ('Mint Chocolate Chip', true),
        ('Rocky Road', false),
        ('Cookie Dough', true);
    `;
    await client.query(seedData);
    console.log("Seed data inserted");

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();
