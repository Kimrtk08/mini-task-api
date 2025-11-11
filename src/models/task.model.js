const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Task {
  static async create({ title, description, status = 'pending', priority = 'medium', ownerId, assignedTo = null, isPublic = false }) {
    const id = uuidv4();
    await db.execute(
      'INSERT INTO tasks (id, title, description, status, priority, ownerId, assignedTo, isPublic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, status, priority, ownerId, assignedTo, isPublic]
    );
    return await this.findById(id);
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
    if (filters.priority) { query += ' AND priority = ?'; params.push(filters.priority); }
    if (filters.assignedTo) { query += ' AND assignedTo = ?'; params.push(filters.assignedTo); }
    if (filters.isPublic !== undefined) { query += ' AND isPublic = ?'; params.push(filters.isPublic); }
    if (filters.ownerId) { query += ' AND ownerId = ?'; params.push(filters.ownerId); }

    // Sorting
    if (filters.sort) {
      const [field, order] = filters.sort.split(':');
      if (['createdAt', 'updatedAt', 'priority', 'status'].includes(field) && ['asc', 'desc'].includes(order)) {
        query += ` ORDER BY ${field} ${order.toUpperCase()}`;
      }
    } else {
      query += ' ORDER BY createdAt DESC';
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE 1=1';
    const countParams = [];
    if (filters.status) { countQuery += ' AND status = ?'; countParams.push(filters.status); }
    if (filters.priority) { countQuery += ' AND priority = ?'; countParams.push(filters.priority); }
    if (filters.assignedTo) { countQuery += ' AND assignedTo = ?'; countParams.push(filters.assignedTo); }
    if (filters.isPublic !== undefined) { countQuery += ' AND isPublic = ?'; countParams.push(filters.isPublic); }
    if (filters.ownerId) { countQuery += ' AND ownerId = ?'; countParams.push(filters.ownerId); }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    return {
      tasks: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority); }
    if (data.assignedTo !== undefined) { fields.push('assignedTo = ?'); values.push(data.assignedTo); }
    if (data.isPublic !== undefined) { fields.push('isPublic = ?'); values.push(data.isPublic); }
    if (fields.length === 0) return null;
    values.push(id);
    await db.execute(`UPDATE tasks SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return await this.findById(id);
  }

  static async updateStatus(id, status) {
    await db.execute('UPDATE tasks SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return await this.findById(id);
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async saveIdempotencyKey(key, userId, reqBody, resStatus, resBody, expiresAt) {
    await db.execute(
      'INSERT INTO idempotency_keys (idempotencyKey, userId, requestBody, responseStatus, responseBody, expiresAt) VALUES (?, ?, ?, ?, ?, ?)',
      [key, userId, JSON.stringify(reqBody), resStatus, JSON.stringify(resBody), expiresAt]
    );
  }

  static async findIdempotencyKey(key, userId) {
    const [rows] = await db.execute(
      'SELECT * FROM idempotency_keys WHERE idempotencyKey = ? AND userId = ? AND expiresAt > NOW()',
      [key, userId]
    );
    return rows[0];
  }

  static async cleanupExpiredIdempotencyKeys() {
    await db.execute('DELETE FROM idempotency_keys WHERE expiresAt <= NOW()');
  }
}

module.exports = Task;