const rateLimit = require('express-rate-limit');

const saveDataLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

module.exports = {
    saveDataLimiter,
    authLimiter
};
