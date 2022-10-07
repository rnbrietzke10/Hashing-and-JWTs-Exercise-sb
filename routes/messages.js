const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const Message = require('../models/message');
const db = require('../db');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const message = await Message.get(id);
    console.log(req.user);
    if (
      req.user.username !== message.from_user.username ||
      req.user.username !== message.to_user.username
    ) {
      return new ExpressError(
        'You do not have permission to access this message',
        403
      );
    } else {
      return res.json(message);
    }
  } catch (e) {
    next(e);
  }
});
/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async (req, res, next) => {
  const { username } = req.user;
  const { to_user, body } = req.body;
  const messageInfo = { from_username: username, to_username: to_user, body };
  if (!req.user) {
    const e = new ExpressError('You must be logged in to send a message', 401);
    return next(e);
  }
  const message = await Message.create(messageInfo);
  return res.json({ message });
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', async (req, res, next) => {
  const { id } = req.params;
  const results = await db.query(
    `SELECT to_username FROM messages WHERE id=$1`,
    [id]
  );

  if (req.user.username !== results.rows[0].to_username) {
    return new ExpressError('You do not have permission to mark as read', 403);
  } else {
    const readAt = await Message.markRead(id);
    return res.json({ msg: readAt });
  }
});

module.exports = router;
