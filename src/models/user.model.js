const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class User {
  static async create({ email, password, name, role = 'user', isPremium = false, subscriptionExpiry = null }) {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (id, email, password, name, role, isPremium, subscriptionExpiry) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, hashedPassword, name, role, isPremium, subscriptionExpiry]
    );
    return { id, email, name, role, isPremium, subscriptionExpiry };
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.password) { fields.push('password = ?'); values.push(await bcrypt.hash(data.password, 10)); }
    if (fields.length === 0) return null;
    values.push(id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await db.execute('SELECT id, email, name, role, isPremium, subscriptionExpiry, createdAt FROM users');
    return rows;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async saveRefreshToken(userId, token, expiresAt) {
    await db.execute('INSERT INTO refresh_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)', 
      [uuidv4(), userId, token, expiresAt]);
  }

  static async findRefreshToken(token) {
    const [rows] = await db.execute('SELECT * FROM refresh_tokens WHERE token = ? AND expiresAt > NOW()', [token]);
    return rows[0];
  }

  static async deleteRefreshToken(token) {
    await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  }

  static async blacklistToken(token, expiresAt) {
    await db.execute('INSERT INTO blacklisted_tokens (token, expiresAt) VALUES (?, ?)', [token, expiresAt]);
  }

  static async isTokenBlacklisted(token) {
    const [rows] = await db.execute('SELECT * FROM blacklisted_tokens WHERE token = ? AND expiresAt > NOW()', [token]);
    return rows.length > 0;
  }

  static async cleanupExpiredTokens() {
    await db.execute('DELETE FROM refresh_tokens WHERE expiresAt <= NOW()');
    await db.execute('DELETE FROM blacklisted_tokens WHERE expiresAt <= NOW()');
  }
}

module.exports = User;