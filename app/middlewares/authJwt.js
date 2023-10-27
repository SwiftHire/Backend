const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const db = require('../models');
const { INTERNAL_SERVER_ERROR, UNAUTHORIZED, FORBIDDEN } = require('../utils/errorMessages');
const User = db.user;
const Role = db.role;

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
    if (err instanceof TokenExpiredError) {
        return res.status(UNAUTHORIZED.status).send({
            message: `${UNAUTHORIZED.message} Access Token has expired!`
        });
    }

    return res.status(UNAUTHORIZED.status).send({
        message: UNAUTHORIZED.message
    });
};

const verifyToken = (req, res, next) => {
    const bearerToken = req.headers.authorization;
    const token = bearerToken?.split('Bearer ')[1];

    if (!token) {
        return res.status(UNAUTHORIZED.status).send({
            message: `${UNAUTHORIZED.message} No token provided!`
        });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return catchError(err, res);
        }
        req.userId = decoded.id;
        return next();
    });
};


const isAdmin = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            console.log('[isAdmin] Error: ', err);
            return res.status(INTERNAL_SERVER_ERROR.status).send({
                message: INTERNAL_SERVER_ERROR.message
            });
        }

        Role.find(
            {
                _id: { $in: user.roles }
            },
            (err, roles) => {
                if (err) {
                    console.log('[isAdmin] Error: ', err);
                    return res.status(INTERNAL_SERVER_ERROR.status).send({
                        message: INTERNAL_SERVER_ERROR.message
                    });
                }

                const isAdminRole = roles.some(role => role.name === 'admin');

                if (isAdminRole) return next();

                return res.status(FORBIDDEN.status).send({
                    message: `${FORBIDDEN.message} Admin role required!`
                });
            }
        );
    });
};

const authJwt = {
    verifyToken,
    isAdmin,
};
module.exports = authJwt;
