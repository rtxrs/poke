const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { readUsers, writeUsers } = require('../services/userService');
const { authLimiter } = require('../middlewares/rateLimiter');
const { SALT_ROUNDS } = require('../config');

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

router.get('/register', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'register.html')));

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { web_username, password, playerId } = req.body;
        if (!web_username || !password || !playerId) {
            return res.status(400).send('Web Username, Password, and Player Support ID are all required.');
        }

        const users = await readUsers();
        const userIndex = users.findIndex(u => u.playerId === playerId);

        if (userIndex === -1) {
            return res.status(404).send('Player ID not found. Please upload your data from the PGSharp app before registering.');
        }

        if (users[userIndex].web_username !== "" || users[userIndex].password !== "") {
            return res.status(409).send('This Player ID has already been registered. <a href="/login.html">Try logging in</a>.');
        }
        
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        users[userIndex].web_username = web_username;
        users[userIndex].password = hashedPassword;
        await writeUsers(users);

        res.redirect('/login.html');
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send('Server error during registration.');
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password, playerId } = req.body;
        const users = await readUsers();
        let user;

        if (playerId) {
            user = users.find(u => u.playerId === playerId);
        } else if (username && password) {
            const loginIdentifier = username.toLowerCase();
            user = users.find(u => 
                (u.web_username && u.web_username.toLowerCase() === loginIdentifier) || 
                u.username.toLowerCase() === loginIdentifier
            );

            if (user && user.password !== "" && !(await bcrypt.compare(password, user.password))) {
                user = null;
            }
        }
        
        if (user) {
            req.session.user = { username: user.web_username || user.username, playerId: user.playerId };
            return res.json({ success: true });
        }

        res.status(401).json({ success: false, message: 'Login failed. Please check your credentials or register.' });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

router.get('/me', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'private.html')));

module.exports = { router, isAuthenticated };
