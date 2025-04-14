const express = require('express');
const router = express.Router();
const authenticationController = require('../../controllers/authentication.js');

router.put('/signup')