const express = require('express');
const { celebrate } = require('celebrate');

const isAuth = require('../middlewares/isAuth');

const userController = require('../controllers/user');
const authValidator = require('../validators/auth');

const route = express.Router();

module.exports = (app) => {
  app.use('/auth', route);

  route.get(
    '/',
    isAuth,
    async (req, res) => 
      res.json({
      status: 'OK',
      email: req.user.email,
    }).status(200),
  );

  route.post(
    '/register',
    celebrate(authValidator.register),
    async (req, res, next) => {
      try {
        // email checker
        const exitingUser = await userController.findByEmail(req.body.email);
        if (exitingUser) {
          throw new Error('Email is already registered!');
        }

        // register user
        await userController.create(
          req.body.email,
          req.body.full_name,
          req.body.password,
        );

        return res.redirect('/logins');
      } catch (err) {
        return next(err);
      }
    },
  );

  route.post(
    '/login',
    celebrate(authValidator.login),
    async (req, res, next) => {
      try {
        const user = await userController.login(
          req.body.email,
          req.body.password,
        );

        if (!user) {
          throw new Error('Wrong email or password!');
        }
        const token = await userController.generateToken(user.id);
        res.cookie('jwt', token, {httpOnly: true});

        return res.redirect('/protected');
      } catch (err) {
        return next(err);
      }
    },
  );

  route.get('/cookie', async(req, res) => {
    console.log('cookies: ', req.cookies)
    res.status(200).json({
      cookies: req.cookies,
    })

  });

  //read more on middleware here: https://expressjs.com/en/guide/using-middleware.html
  //token endpoint to check out how verifyToken middleware works
  //if the token isn't correct then our middleware in /middleware/token gives an error responde
  route.post('/token', isAuth, (req, res) => {
      // in case you want to read everything from the request header
      // console.log({req})
      res.status(200).send("token correct: access granted!")
  })

};