import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('profile').name)
    .setDescription(i18n.getCommand('profile').description)
    .addUserOption(option =>
      option
        .setName('المستخدم')
        .setDescription('المستخدم المراد عرض بروفايله')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('المستخدم') || interaction.user;

    // Get streamer data
    const streamer = database.get(
      'SELECT * FROM streamers WHERE user_id = ?',
      [targetUser.id]
    );

    if (!streamer) {
      await interaction.reply({
        content: '❌ هذا المستخدم ليس ستريمر',
        ephemeral: true
      });
      return;
    }

    // Get wallet data
    const wallet = database.get(
      'SELECT * FROM wallets WHERE user_id = ?',
      [targetUser.id]
    ) || { balance: 0 };

    // Get content stats
    const contentStats = database.get(
      `SELECT 
        COUNT(*) as total_content,
        SUM(CASE WHEN content_type = 'video' THEN 1 ELSE 0 END) as videos,
        SUM(CASE WHEN content_type = 'stream' THEN duration ELSE 0 END) as stream_hours
       FROM streamer_content 
       WHERE streamer_id = ?`,
      [targetUser.id]
    ) || { total_content: 0, videos: 0, stream_hours: 0 };

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle(`👤 ${i18n.t('streamer.profile')}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📛 الاسم', value: targetUser.tag, inline: true },
        { name: '🎬 المنصة', value: streamer.platform, inline: true },
        { name: '📊 الحالة', value: getStatusEmoji(streamer.status), inline: true },
        { name: '📹 الفيديوهات', value: String(contentStats.videos || 0), inline: true },
        { name: '⏱️ ساعات البث', value: `${(contentStats.stream_hours || 0).toFixed(1)} ساعة`, inline: true },
        { name: '⭐ التقييم', value: `${(streamer.performance_rating || 0).toFixed(1)}/10`, inline: true },
        { name: '💰 الرصيد', value: `${wallet.balance} كريدت`, inline: true },
        { name: '📅 تاريخ الانضمام', value: new Date(streamer.created_at).toLocaleDateString('ar-SA'), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'نظام إدارة الستريمرز' });

    if (streamer.channel_url) {
      embed.setURL(streamer.channel_url);
    }

    await interaction.reply({ embeds: [embed] });
  },
};

function getStatusEmoji(status) {
  const statuses = {
    'pending': '⏳ قيد المراجعة',
    'approved': '✅ مقبول',
    'rejected': '❌ مرفوض',
    'suspended': '⛔ موقوف'
  };
  return statuses[status] || status;
}
