#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');
const express = require('express');
const { getDeviceInfo, detectDevice } = require('./lib/tools');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/detect', async (req, res) => {
    const { userAgent } = req.body;
    
    if (!userAgent) {
        return res.status(400).json({
            success: false,
            message: 'User Agent is required!'
        });
    }
    
    try {
        const result = await detectDevice(userAgent);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `${error.message}`
        });
    }
});

app.post('/api/device', async (req, res) => {
    const { url, userAgent } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            message: 'URL is required!'
        });
    }
    
    try {
        const result = await getDeviceInfo(url, userAgent);
        res.json(result);
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
