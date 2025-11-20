import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('missions').name)
    .setDescription(i18n.getCommand('missions').description),

  async execute(interaction) {
    // Check if user is a streamer
    const streamer = database.get(
      'SELECT * FROM streamers WHERE user_id = ? AND status = ?',
      [interaction.user.id, 'approved']
    );

    if (!streamer) {
      await interaction.reply({
        content: '❌ يجب أن تكون ستريمر مقبول لاستخدام هذا الأمر',
        ephemeral: true
      });
      return;
    }

    // Get this week's content
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyContent = database.all(
      `SELECT * FROM streamer_content 
       WHERE streamer_id = ? 
       AND created_at >= datetime(?)
       ORDER BY created_at DESC`,
      [interaction.user.id, weekStart.toISOString()]
    );

    const videos = weeklyContent.filter(c => c.content_type === 'video').length;
    const streamHours = weeklyContent
      .filter(c => c.content_type === 'stream')
      .reduce((sum, c) => sum + (c.duration || 0), 0);

    // Weekly requirements (from config)
    const requiredVideos = 3;
    const requiredHours = 10;

    const videosProgress = Math.min((videos / requiredVideos) * 100, 100);
    const hoursProgress = Math.min((streamHours / requiredHours) * 100, 100);

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('📋 ' + i18n.t('wallet.weekly_mission'))
      .setDescription('مهامك الأسبوعية كستريمر')
      .addFields(
        {
          name: '📹 الفيديوهات',
          value: `${videos}/${requiredVideos}\n${getProgressBar(videosProgress)}`,
          inline: false
        },
        {
          name: '⏱️ ساعات البث',
          value: `${streamHours.toFixed(1)}/${requiredHours}\n${getProgressBar(hoursProgress)}`,
          inline: false
        },
        {
          name: '💰 المكافآت المتوقعة',
          value: `${(videos * 100) + (Math.floor(streamHours) * 50)} كريدت`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'يتم التحديث أسبوعياً' });

    if (videos >= requiredVideos && streamHours >= requiredHours) {
      embed.setDescription('✅ **أكملت جميع مهامك الأسبوعية! أحسنت!**');
    } else {
      const remaining = [];
      if (videos < requiredVideos) {
        remaining.push(`📹 ${requiredVideos - videos} فيديوهات`);
      }
      if (streamHours < requiredHours) {
        remaining.push(`⏱️ ${(requiredHours - streamHours).toFixed(1)} ساعات بث`);
      }
      embed.addFields({
        name: '⚠️ المتبقي',
        value: remaining.join('\n'),
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

function getProgressBar(percentage) {
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(0)}%`;
}
