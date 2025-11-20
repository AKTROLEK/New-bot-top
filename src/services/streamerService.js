import database from '../models/database.js';
import logger from '../utils/logger.js';

class StreamerService {
  /**
   * Apply to become a streamer
   */
  applyAsStreamer(userId, platform, channelUrl) {
    try {
      const existing = database.get(
        'SELECT * FROM streamers WHERE user_id = ?',
        [userId]
      );

      if (existing) {
        return { success: false, message: 'Already applied' };
      }

      database.run(
        'INSERT INTO streamers (user_id, platform, channel_url, status) VALUES (?, ?, ?, ?)',
        [userId, platform, channelUrl, 'pending']
      );

      return { success: true };
    } catch (error) {
      logger.error('Error applying as streamer:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Approve or reject streamer application
   */
  reviewApplication(userId, approved, reason = null) {
    try {
      const status = approved ? 'approved' : 'rejected';
      const approvedAt = approved ? new Date().toISOString() : null;

      database.run(
        'UPDATE streamers SET status = ?, approved_at = ? WHERE user_id = ?',
        [status, approvedAt, userId]
      );

      return { success: true, status };
    } catch (error) {
      logger.error('Error reviewing application:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Add content (video or stream)
   */
  addContent(userId, contentType, url, duration = null, views = 0) {
    try {
      // Check if user is approved streamer
      const streamer = database.get(
        'SELECT * FROM streamers WHERE user_id = ? AND status = ?',
        [userId, 'approved']
      );

      if (!streamer) {
        return { success: false, message: 'Not an approved streamer' };
      }

      database.run(
        'INSERT INTO streamer_content (streamer_id, content_type, url, duration, views) VALUES (?, ?, ?, ?, ?)',
        [userId, contentType, url, duration, views]
      );

      // Update streamer stats
      if (contentType === 'video') {
        database.run(
          'UPDATE streamers SET total_videos = total_videos + 1 WHERE user_id = ?',
          [userId]
        );
      } else if (contentType === 'stream' && duration) {
        database.run(
          'UPDATE streamers SET total_hours = total_hours + ? WHERE user_id = ?',
          [duration, userId]
        );
      }

      return { success: true };
    } catch (error) {
      logger.error('Error adding content:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get streamer statistics
   */
  getStreamerStats(userId, period = 'week') {
    try {
      let dateFilter = '';
      const now = new Date();

      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= datetime('${weekAgo.toISOString()}')`;
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= datetime('${monthAgo.toISOString()}')`;
      }

      const stats = database.get(
        `SELECT 
          COUNT(CASE WHEN content_type = 'video' THEN 1 END) as videos,
          SUM(CASE WHEN content_type = 'stream' THEN duration ELSE 0 END) as stream_hours,
          SUM(views) as total_views
         FROM streamer_content 
         WHERE streamer_id = ? ${dateFilter}`,
        [userId]
      );

      // Get overall streamer info
      const streamer = database.get(
        'SELECT * FROM streamers WHERE user_id = ?',
        [userId]
      );

      return {
        ...stats,
        total_videos: streamer?.total_videos || 0,
        total_hours: streamer?.total_hours || 0,
        performance_rating: streamer?.performance_rating || 0,
        status: streamer?.status
      };
    } catch (error) {
      logger.error('Error getting streamer stats:', error);
      return null;
    }
  }

  /**
   * Calculate and update performance rating
   */
  updatePerformanceRating(userId) {
    try {
      const weeklyStats = this.getStreamerStats(userId, 'week');
      
      // Calculate rating (0-10)
      // Based on weekly requirements: 3 videos, 10 hours
      const videoScore = Math.min((weeklyStats.videos / 3) * 5, 5);
      const hoursScore = Math.min((weeklyStats.stream_hours / 10) * 5, 5);
      const rating = videoScore + hoursScore;

      database.run(
        'UPDATE streamers SET performance_rating = ? WHERE user_id = ?',
        [rating, userId]
      );

      return { success: true, rating };
    } catch (error) {
      logger.error('Error updating performance rating:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get top streamers
   */
  getTopStreamers(limit = 3) {
    try {
      const streamers = database.all(
        'SELECT * FROM streamers WHERE status = ? ORDER BY performance_rating DESC LIMIT ?',
        ['approved', limit]
      );
      return streamers;
    } catch (error) {
      logger.error('Error getting top streamers:', error);
      return [];
    }
  }

  /**
   * Check weekly requirements
   */
  checkWeeklyRequirements(userId) {
    try {
      const stats = this.getStreamerStats(userId, 'week');
      
      const requirements = {
        videos: { required: 3, current: stats.videos, met: stats.videos >= 3 },
        hours: { required: 10, current: stats.stream_hours, met: stats.stream_hours >= 10 }
      };

      const allMet = requirements.videos.met && requirements.hours.met;

      return { requirements, allMet };
    } catch (error) {
      logger.error('Error checking requirements:', error);
      return null;
    }
  }
}

export default new StreamerService();
