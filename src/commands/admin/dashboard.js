import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18n from '../../utils/i18n.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('dashboard').name)
    .setDescription(i18n.getCommand('dashboard').description)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const dashboardUrl = `${config.web.url}/dashboard`;

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('🖥️ لوحة التحكم')
      .setDescription('الوصول إلى لوحة التحكم الكاملة للبوت')
      .addFields(
        { name: '🔗 الرابط', value: `[دخول لوحة التحكم](${dashboardUrl})` },
        { name: '✨ المميزات', value: '• إدارة نظام الدعم\n• إدارة التفعيل\n• إدارة الستريمرز\n• إحصائيات الأداء\n• إعدادات الحماية\n• وأكثر...' }
      )
      .setTimestamp()
      .setFooter({ text: 'نظام لوحة التحكم المتقدمة' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
