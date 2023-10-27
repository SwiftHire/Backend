const rateLimit = require('express-rate-limit');

const rateLimiterUsingThirdParty = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Too many requests!',
    standardHeaders: false,
    legacyHeaders: false,
});

module.exports = rateLimiterUsingThirdParty;