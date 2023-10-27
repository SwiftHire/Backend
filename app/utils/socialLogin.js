const jwt = require('jsonwebtoken');
const {google} = require('googleapis');
const db = require('../models');
const { refreshToken: RefreshToken } = db;
const { user: User } = require('../models');
const config = require('../config/auth.config');

const socialLoginResponse = async (user) => {

    const token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.jwtExpiration,
    });
    const refreshToken = await RefreshToken.createToken(user);
    const data = {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        accessToken: token,
        refreshToken: refreshToken,
    }
    return data
    
};

const socialLoginUser = async (name, email, token) => {

    // find current user in UserModel
    let user = await User.findOne({
        email: email,
    }).populate('roles', '-__v').exec();

      // create new user if the database doesn't have this user
    if (!user) {
        
        const userObj = new User({
            name: name,
            email: email,
            password: token,
            emailVerification: 'verified', // set emailverification to verify for social logins
        });
        user = await userObj.save();
        }
    return socialLoginResponse(user)

};

module.exports = {
    socialLoginUser,
};