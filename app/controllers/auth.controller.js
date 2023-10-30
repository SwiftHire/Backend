const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const sendEmail = require('../notifications/email/sendEmail');
const config = require('../config/auth.config');
const db = require('../models');
const { mailchimpTags } = require('../utils/mailchimpTags');
const {
    user: User,
    role: Role,
    refreshToken: RefreshToken,
    resetToken: ResetToken,
    emailValidationToken: EmailValidationToken,
} = db;
const { INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, UNAUTHORIZED, FORBIDDEN } = require('../utils/errorMessages');

const invalidSignUpBody = (body) => !body.name || !body.email || !body.password;

const invalidSignInBody = (body) => !body.email || !body.password;

const invalidForgotPasswordBody = (body) => !body.email;

const invalidResetPasswordBody = (body) => !body.token || !body.password;

const invalidEmailValidationBody = (body) => !body.token;

const sendValidationEmailToUser =
    async (user, subject = 'Email validation', template = './template/email-validation.handlebars') => {
        // create a  new validation token
        const emailValidationToken = await EmailValidationToken.createValidationToken(user);
        const validationUrl = new URL(`${config.webBaseUrl}/validate-email`);
        validationUrl.searchParams.set('token', emailValidationToken.token);

        sendEmail({
            from: 'contact@majorgen.com',
            to: user.email,
            subject,
            template,
            templateData: {
                name: user.name,
                validationLink: validationUrl.toString(),
            },
        });

        await emailValidationToken.save();
    };

exports.signUp = async (req, res) => {
    try {
        const validUserTypes = ['employer', 'applicant'];

        if (invalidSignUpBody(req.body) || !req.body.userType || !validUserTypes.includes(req.body.userType)) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Please provide name, email, password, and a valid userType (employer or applicant)!`
            });
        }
    
        const userObj = new User({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, config.bcryptSalt),
            emailVerification: 'pending',
            userType: req.body.userType  // Add this line
        });        
    
        console.log('[signUp] User object created:', userObj);
    
        if (Array.isArray(req.body.roles) && req.body.roles.length) {
            const roles = await Role.find({ name: { $in: req.body.roles } });
            userObj.roles = roles.map((role) => role._id);
        } else {
            // add default role
            const role = await Role.findOne({ name: 'user' });
            userObj.roles = [role._id];
        }
    
        console.log('[signUp] User roles assigned:', userObj.roles);
    
        const user = await userObj.save();
    
        console.log('[signUp] User saved to database:', user);
    
        return res.status(201).send({
            message: 'User was registered successfully!'
        });
    } catch (err) {
        console.log('[signUp] Error: ', err.message);
        console.log('[signUp] Full error object:', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.signIn = async (req, res) => {
    try {
        if (invalidSignInBody(req.body)) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Please provide email and password!`
            });
        }

        const user = await User.findOne({
            email: req.body.email,
        }).populate('roles', '-__v').exec();

        console.log('[signIn] Found user:', user);

        if (!user || user.isArchived) {
            return res.status(NOT_FOUND.status).send({
                message: 'User' + ' ' + NOT_FOUND.message
            });
        }

        // accept only verified and pending
        if (user.emailVerification !== 'verified') {
            // for users created before this field was added
            user.emailVerification = 'pending';
            await user.save();
            console.log('[signIn] User email verification status updated:', user);

            await sendValidationEmailToUser(user);
            console.log('[signIn] Validation email sent to user:', user.email);
        }

        const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        console.log('[signIn] Password validation result:', passwordIsValid);

        if (!passwordIsValid) {
            return res.status(UNAUTHORIZED.status).send({
                accessToken: null,
                message: `${UNAUTHORIZED.message} Invalid credentials!`,
            });
        }

        const token = jwt.sign({ id: user.id }, config.secret, {
            expiresIn: config.jwtExpiration,
        });

        console.log('[signIn] Generated access token:', token);

        const refreshToken = await RefreshToken.createToken(user);

        console.log('[signIn] Generated refresh token:', refreshToken);

        const authorities = [];

        user.roles.forEach((role) => authorities.push('ROLE_' + role.name.toUpperCase()));

        console.log('[signIn] User roles:', authorities);
        
        return res.send({
            id: user._id,
            name: user.name,
            email: user.email,
            emailVerification: user.emailVerification,
            roles: authorities,
            accessToken: token,
            refreshToken: refreshToken,
            userType: user.userType  // Add this line
        });
        
    } catch (err) {
        console.log('[signIn] Error: ', err.message);
        console.log('[signIn] Full error object:', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken: requestToken } = req.body;

    if (!requestToken) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Refresh Token is required!`
        });
    }

    try {
        const refreshToken = await RefreshToken.findOne({ token: requestToken });

        if (!refreshToken) {
            return res.status(FORBIDDEN.status).send({
                message: `${FORBIDDEN.message} Invalid refresh token, Please sign in again!`
            });
        }

        if (RefreshToken.verifyExpiration(refreshToken)) {
            await RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec();

            return res.status(FORBIDDEN.status).send({
                message: `${FORBIDDEN.message} Refresh token has expired. Please sign in again!`
            });
        }

        const newAccessToken = jwt.sign({ id: refreshToken.user._id }, config.secret, {
            expiresIn: config.jwtExpiration,
        });

        return res.json({
            accessToken: newAccessToken,
            refreshToken: refreshToken.token,
        });
    } catch (err) {
        console.log('[refreshToken] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.forgotPassword = async (req, res) => {
    if (invalidForgotPasswordBody(req.body)) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Please provide email!`
        });
    }

    try {
        User.findOne({
            email: req.body.email,
        }).exec(async (err, user) => {
            if (err) {
                console.log('[forgotPassword] Error: ', err);
                return res.status(INTERNAL_SERVER_ERROR.status).send({
                    message: INTERNAL_SERVER_ERROR.message
                });
            }

            if (user) {
                try {
                    // verify if user already has any reset tokens and delete them
                    const oldResetToken = await ResetToken.findOne({ user: user._id });
                    if (oldResetToken) await ResetToken.deleteMany({ user: user._id });

                    // create a  new reset token
                    const resetToken = await ResetToken.createToken(user);

                    const resetUrl = new URL(`${config.webBaseUrl}/reset-password`);
                    resetUrl.searchParams.set('token', resetToken.token);

                    console.log('[forgotPassword] Reset Url: ', resetUrl.toString());

                    sendEmail({
                        from: 'contact@majorgen.com',
                        to: user.email,
                        subject: 'Password Reset Request',
                        template: './template/forgotPassword.handlebars',
                        templateData: {
                            name: user.name,
                            link: resetUrl.toString(),
                        },
                    });

                    resetToken.emailStatus = true;
                    resetToken.save();
                } catch (err) {
                    console.log('[forgotPassword] Error: ', err);
                    return res.status(INTERNAL_SERVER_ERROR.status).send({
                        message: INTERNAL_SERVER_ERROR.message
                    });
                }
            }

            return res.status(200).send({
                message: 'If your email address exists in our database, ' +
                    'you will receive a password recovery link at your email address in a few minutes.'
            });
        });
    } catch (err) {
        console.log('[forgotPassword] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.resetPassword = async (req, res) => {
    if (invalidResetPasswordBody(req.body)) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Please provide reset token and password!`
        });
    }

    try {
        const { token, password: newPassword } = req.body;

        const resetToken = await ResetToken.findOne({ token: token });

        if (!resetToken) {
            return res.status(FORBIDDEN.status).send({
                message: `${FORBIDDEN.message} Invalid reset token! Please request new password reset!`
            });
        }

        if (ResetToken.verifyExpiration(resetToken)) {
            await ResetToken.findByIdAndRemove(resetToken._id, { useFindAndModify: false }).exec();

            return res.status(FORBIDDEN.status).send({
                message: `${FORBIDDEN.message} Reset token has expired. Please request new password reset!`
            });
        }

        const user = await User.findById(resetToken.user).exec();
        user.password = bcrypt.hashSync(newPassword, config.bcryptSalt);
        await user.save();
        await ResetToken.findByIdAndRemove(resetToken._id, { useFindAndModify: false }).exec();

        console.log('[resetPassword] Password has been reset');

        sendEmail({
            from: 'contact@majorgen.com',
            to: user.email,
            subject: 'Password Reset Request',
            template: './template/resetPassword.handlebars',
            templateData: {
                name: user.name,
            },
        });

        return res.send({
            message: 'User password was updated successfully!'
        });
    } catch (err) {
        console.log('[resetPassword] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.validateEmail = async (req, res) => {
    if (invalidEmailValidationBody(req.body)) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Please provide the email validation token!`
        });
    }

    try {
        const { token } = req.body;

        const emailValidationToken = await EmailValidationToken.findOne({ token });

        if (!emailValidationToken) {
            return res.status(FORBIDDEN.status).send({
                message: `${FORBIDDEN.message} Invalid email validation token! Please request a new validation!`
            });
        }

        const user = await User.findById(emailValidationToken.user).exec();
        user.emailVerification = 'verified';
        await user.save();
        await EmailValidationToken.findByIdAndRemove(emailValidationToken._id, { useFindAndModify: false }).exec();
        return res.send({
            message: 'Email has been verified successfully!',
        });
    } catch (err) {
        console.log('[validateEmail] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.changePassword = async (req, res) => {
    
    try {
        const userId = req.userId;

        const { newPassword, oldPassword } = req.body;

        const user = await User.findOne({
            _id: userId,
        }).populate('roles', '-__v').exec();

        console.log('[change password] Found user:', user);
        
        const passwordIsValid = bcrypt.compareSync(
            oldPassword,
            user.password,
        );

        console.log('[change password] Password validation result:', passwordIsValid);

        if (!passwordIsValid) {
            return res.status(UNAUTHORIZED.status).send({
                accessToken: null,
                message: `${UNAUTHORIZED.message} Invalid old password!`,
            });
        }

        user.password = bcrypt.hashSync(newPassword, config.bcryptSalt);
        await user.save();
        
        res.status(200).send({
            status: true,
            message: 'Password changed successfully!',
        });

    } catch (err) {
        console.log('[change password] Error: ', err.message);
        console.log('[change password] Full error object:', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};