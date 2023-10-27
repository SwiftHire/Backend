const { ROLES, user: User } = require('../models');
const { INTERNAL_SERVER_ERROR, BAD_REQUEST, FORBIDDEN, CONFLICT } = require('../utils/errorMessages');
const validateEmail  = require('../utils/validateEmail');
const validatePassword = require('../utils/validatePassword');

const checkDuplicateEmail = (req, res, next) => {
    if (!req.body.email) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Email is required!`
        });
    }

    User.findOne({
        email: req.body.email,
    }).exec((err, user) => {
        if (err) {
            console.log('[checkDuplicateEmail] Error: ', err);
            return res.status(INTERNAL_SERVER_ERROR.status).send({
                message: INTERNAL_SERVER_ERROR.message
            });
        }

        if (user) {
            return res.status(CONFLICT.status).send({
                message: `${CONFLICT.message} User already exists!`
            });
        }

        return next();
    });
};

const checkRolesExisted = (req, res, next) => {
    if (Array.isArray(req.body.roles) && req.body.roles.length) {
        const unauthorizedRole = req.body.roles.find(role => !ROLES.includes(role));

        if (unauthorizedRole) {
            return res.status(FORBIDDEN.status).send({
                message: `${FORBIDDEN.message} Unauthorized role ${unauthorizedRole}!`
            });
        }
    }

    return next();
};

const checkValidEmail = (req, res, next) => {
    if (!req.body.email) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Email is required!`
        });
    }

    if (!validateEmail(req.body.email)) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Invalid email!`
        });
    }

    return next();
};

const checkValidPassword = (req, res, next) => {
    if (!req.body.password) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Email is required!`
        });
    }

    if (!validatePassword(req.body.password)) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Invalid password format! The password must have at least 8 characters, ` +
                '1 letter in lower case, 1 in upper case, 1 number and 1 special character.',
        });
    }

    return next();
};

const verifySignUp = {
    checkValidEmail,
    checkValidPassword,
    checkDuplicateEmail,
    checkRolesExisted
};

module.exports = verifySignUp;
