module.exports = {
    secret: process.env.SECRET_TOKEN_GENERATOR,
    bcryptSalt: parseInt(process.env.BCRYPT_SALT),
    jwtExpiration: parseInt(process.env.ACCESS_TOKEN_TTL),
    jwtRefreshExpiration: parseInt(process.env.REFRESH_TOKEN_TTL),
    passwordResetExpiration: parseInt(process.env.RESET_TOKEN_TTL),
    webBaseUrl: process.env.WEB_BASE_URL,
    paymentUrl: process.env.PAYMENTS_API_URL,
    paymentServerToken: process.env.PAYMENT_SERVER_TOKEN,
};
