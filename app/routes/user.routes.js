const express = require('express');
const router = express.Router();
const { authJwt } = require('../middlewares');
const controller = require('../controllers/user.controller');

router.get('/me', authJwt.verifyToken, controller.getMe);
router.delete('/delete', authJwt.verifyToken, controller.deleteUser);
router.get('/get-users', controller.getUsers);

module.exports = router;
