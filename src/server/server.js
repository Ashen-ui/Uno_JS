//Complete code
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/static', express.static(path.join(__dirname, '../../static')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/index.html'));
});

app.get('/inscription', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/registration.html'));
});

app.get('/connexion', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/connection.html'));
});

app.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/lobby.html'));
});
    
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Template/game.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});