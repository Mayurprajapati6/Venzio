import express from 'express';
import pingRouter from './ping.router';
import authRouter from '../../modules/auth/auth.router';
import subscriptionRouter from '../../modules/subscription/subscription.router'

const v1Router = express.Router();



v1Router.use('/ping',  pingRouter);

// auth
v1Router.use('/auth', authRouter);

// subscription
v1Router.use('/subscription',subscriptionRouter);

export default v1Router;