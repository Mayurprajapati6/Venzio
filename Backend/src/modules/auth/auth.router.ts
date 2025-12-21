import express from 'express'
import { AuthController } from './auth.controller';
import {  validateRequestBody } from '../../validators';
import { loginSchema, signupSchema } from '../../validators/auth.validator';

const router = express.Router();

router.post('/signup', validateRequestBody(signupSchema) , AuthController.signup);
router.post('/login', validateRequestBody(loginSchema) ,AuthController.login);

export default router;