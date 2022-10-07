const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    if (user) {
      await User.updateLoginTimestamp(username);
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ message: `Welcome back ${username}`, token });
    } else {
      throw new ExpressError('Invalid username/password', 400);
    }
  } catch (e) {
    next(e);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
  const user = await User.register(req.body);
  return res.json({ user });
});

module.exports = router;
