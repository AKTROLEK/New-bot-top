import database from '../models/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class SupportService {
  /**
   * Add user to support queue
   */
  addToQueue(userId, waitingRoomId, category = 'general') {
    try {
      // Check if already in queue
      const existing = database.get(
        'SELECT * FROM support_queue WHERE user_id = ?',
        [userId]
      );

      if (existing) {
        return { success: false, message: 'Already in queue' };
      }

      // Get current position
      const count = database.get(
        'SELECT COUNT(*) as count FROM support_queue'
      );
      const position = (count?.count || 0) + 1;

      database.run(
        'INSERT INTO support_queue (user_id, waiting_room_id, position) VALUES (?, ?, ?)',
        [userId, waitingRoomId, position]
      );

      return { success: true, position };
    } catch (error) {
      logger.error('Error adding to support queue:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove user from support queue
   */
  removeFromQueue(userId) {
    try {
      database.run(
        'DELETE FROM support_queue WHERE user_id = ?',
        [userId]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error removing from support queue:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get next user in queue
   */
  getNextInQueue(waitingRoomId = null) {
    try {
      let query = 'SELECT * FROM support_queue ORDER BY position ASC LIMIT 1';
      let params = [];

      if (waitingRoomId) {
        query = 'SELECT * FROM support_queue WHERE waiting_room_id = ? ORDER BY position ASC LIMIT 1';
        params = [waitingRoomId];
      }

      const user = database.get(query, params);
      return user;
    } catch (error) {
      logger.error('Error getting next in queue:', error);
      return null;
    }
  }

  /**
   * Create a new support case
   */
  createCase(userId, category, description) {
    try {
      const caseId = uuidv4().split('-')[0].toUpperCase();

      database.run(
        'INSERT INTO support_cases (case_id, user_id, category, status) VALUES (?, ?, ?, ?)',
        [caseId, userId, category, 'open']
      );

      return { success: true, caseId };
    } catch (error) {
      logger.error('Error creating support case:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Assign staff to case
   */
  assignStaff(caseId, staffId, channelId) {
    try {
      database.run(
        'UPDATE support_cases SET staff_id = ?, channel_id = ?, status = ? WHERE case_id = ?',
        [staffId, channelId, 'active', caseId]
      );

      // Update staff status
      database.run(
        'INSERT OR REPLACE INTO staff_status (user_id, current_cases, last_active) VALUES (?, COALESCE((SELECT current_cases FROM staff_status WHERE user_id = ?) + 1, 1), CURRENT_TIMESTAMP)',
        [staffId, staffId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error assigning staff:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Close support case
   */
  closeCase(caseId, rating = null, comment = null) {
    try {
      database.run(
        'UPDATE support_cases SET status = ?, closed_at = CURRENT_TIMESTAMP, rating = ?, rating_comment = ? WHERE case_id = ?',
        ['closed', rating, comment, caseId]
      );

      // Get the case to update staff status
      const supportCase = database.get(
        'SELECT staff_id FROM support_cases WHERE case_id = ?',
        [caseId]
      );

      if (supportCase?.staff_id) {
        database.run(
          'UPDATE staff_status SET current_cases = current_cases - 1, total_cases = total_cases + 1 WHERE user_id = ?',
          [supportCase.staff_id]
        );
      }

      return { success: true };
    } catch (error) {
      logger.error('Error closing case:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get available staff members
   */
  getAvailableStaff(maxCases = 3) {
    try {
      const staff = database.all(
        'SELECT * FROM staff_status WHERE status = ? AND current_cases < ? ORDER BY current_cases ASC, last_active DESC',
        ['available', maxCases]
      );
      return staff;
    } catch (error) {
      logger.error('Error getting available staff:', error);
      return [];
    }
  }

  /**
   * Set staff status
   */
  setStaffStatus(userId, status) {
    try {
      database.run(
        'INSERT OR REPLACE INTO staff_status (user_id, status, last_active) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [userId, status]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error setting staff status:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get case statistics
   */
  getStatistics(staffId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' OR status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          AVG(rating) as avg_rating
        FROM support_cases
      `;
      let params = [];

      if (staffId) {
        query += ' WHERE staff_id = ?';
        params = [staffId];
      }

      const stats = database.get(query, params);
      return stats;
    } catch (error) {
      logger.error('Error getting statistics:', error);
      return null;
    }
  }
}

export default new SupportService();
