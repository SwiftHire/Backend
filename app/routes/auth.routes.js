const express = require('express');
const router = express.Router();
const { verifySignUp } = require('../middlewares');
const controller = require('../controllers/auth.controller');
const socialController = require('../controllers/socialLogin.controllers');
const { authJwt } = require('../middlewares');

router.post(
    '/auth/sign-up',
    verifySignUp.checkValidEmail,
    verifySignUp.checkValidPassword,
    verifySignUp.checkDuplicateEmail,
    verifySignUp.checkRolesExisted,
    controller.signUp
);

router.post('/auth/sign-in', controller.signIn);

router.post('/auth/refresh-token', controller.refreshToken);

router.post('/auth/forgot-password', controller.forgotPassword);

router.post('/auth/reset-password', controller.resetPassword);

router.post('/auth/validate-email', controller.validateEmail);

router.get('/auth/google', socialController.googleAuth);
router.post('/auth/google/verify/code', socialController.googleVerifyCode);

router.get('/auth/linkedin', socialController.linkedinAuth);
router.post('/auth/linkedin/verify/code', socialController.linkedinVerifyCode);

router.post('/auth/change-password', authJwt.verifyToken, controller.changePassword);
      
    
module.exports = router;
