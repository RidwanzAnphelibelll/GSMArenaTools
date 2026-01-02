#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');
const express = require('express');
const { getPhoneSpecs, searchPhones } = require('./lib/gsmarena');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search/:query', async (req, res) => {
    const query = req.params.query;
    
    try {
        const result = await searchPhones(query);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `${error.message}`
        });
    }
});

app.get('/specs/:url', async (req, res) => {
    const url = req.params.url;
    
    try {
        const result = await getPhoneSpecs(url, true);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `${error.message}`
        });
    }
});

app.get('/phone/:model', async (req, res) => {
    const model = req.params.model;
    
    try {
        const result = await getPhoneSpecs(model);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `${error.message}`
        });
    }
});

app.listen(port, () => {
    console.log(chalk.green(`Server running on http://localhost:${port}`));
});
