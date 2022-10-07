const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');

const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.use(ensureLoggedIn);
router.get('/', async (req, res, next) => {
  const users = await User.all();
  return res.json({ users });
});
/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res, next) => {
  const { username } = req.params;

  const user = await User.get(username);
  return res.json({ user });
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', async (req, res, next) => {
  try {
    const { username } = req.params;
    if (req.user.username === username) {
      const toMessages = await User.messagesTo(username);
      return res.json({ messages: toMessages });
    } else {
      throw new ExpressError('You do not have access to these messages', 403);
    }
  } catch (e) {
    next(e);
  }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', async (req, res, next) => {
  const { username } = req.params;
  try {
    if (req.user.username === username) {
      const fromMessages = await User.messagesFrom(username);
      return res.json({ messages: fromMessages });
    } else {
      throw new ExpressError('You do not have access to these messages', 403);
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
