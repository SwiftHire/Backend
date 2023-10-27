const mongoose = require('mongoose');
const config = require('../config/auth.config');
const { v4: uuidv4 } = require('uuid');

const RefreshTokenSchema = new mongoose.Schema({
    token: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    expiryDate: Date,
}, {
    timestamps: true,
    collection: 'refreshTokens',
});

RefreshTokenSchema.statics.createToken = async function (user) {
    const expiredAt = new Date();

    expiredAt.setSeconds(
        expiredAt.getSeconds() + config.jwtRefreshExpiration
    );

    const uuidToken = uuidv4();

    const tokenRawObj = new this({
        token: uuidToken,
        user: user._id,
        expiryDate: expiredAt.getTime(),
    });

    const refreshToken = await tokenRawObj.save();

    return refreshToken.token;
};

RefreshTokenSchema.statics.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
};

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = RefreshToken;
