/** User class for message.ly */
const bcrypt = require('bcrypt');
const db = require('../db');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');
const ExpressError = require('../expressError');

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    if (!username || !password) {
      return new ExpressError('A valid username and password is required', 401);
    }
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    // Create current date variable
    const date = new Date();
    const currDate = date.toLocaleDateString();
    const currTime = date.toLocaleTimeString();
    // Put date in correct format for database.
    const joinDate = `${currDate} ${currTime}`;
    const loginTimeStamp = `${joinDate} ${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`;
    // Add user to database
    try {
      const results = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING username, password, first_name, last_name, phone`,
        [
          username,
          hashedPassword,
          first_name,
          last_name,
          phone,
          joinDate,
          loginTimeStamp,
        ]
      );
      return results.rows[0];
    } catch (e) {
      return new ExpressError('Unable to register at this time', 401);
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    if (!username || !password) {
      return new ExpressError('Must enter username and password', 400);
    }
    const results = await db.query(
      `SELECT username, password FROM users WHERE username = $1`,
      [username]
    );
    const user = results.rows[0];
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return true;
      } else {
        return false;
      }
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const date = new Date();
    const loginTimeStamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} ${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`;
    await db.query(`UPDATE users SET last_login_at = $1 WHERE username = $2`, [
      loginTimeStamp,
      username,
    ]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`SELECT * FROM users WHERE username=$1`, [
      username,
    ]);
    if (!results) {
      throw new ExpressError('User not found', 404);
    }
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  /** id SERIAL PRIMARY KEY,
    from_username text NOT NULL REFERENCES users,
    to_username text NOT NULL REFERENCES users,
    body text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT id, to_username, body, sent_at, read_at FROM messages WHERE from_username=$1`,
      [username]
    );
    return results.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT id, from_username, body, sent_at, read_at FROM messages WHERE to_username=$1`,
      [username]
    );
    return results.rows;
  }
}

module.exports = User;
