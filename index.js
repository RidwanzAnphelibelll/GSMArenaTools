#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');
const express = require('express');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(chalk.green(`Server running on http://localhost:${port}`));
});

module.exports = app;
