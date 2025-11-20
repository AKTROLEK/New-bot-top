import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('emergency_mode').name)
    .setDescription(i18n.getCommand('emergency_mode').description)
    .addBooleanOption(option =>
      option
        .setName('تفعيل')
        .setDescription('تفعيل أو إيقاف وضع الطوارئ')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const enable = interaction.options.getBoolean('تفعيل');

    // Update config in database
    database.run(
      'INSERT OR REPLACE INTO bot_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['emergency_mode', enable ? 'true' : 'false']
    );

    // Log the action
    database.run(
      'INSERT INTO security_logs (user_id, action, moderator_id) VALUES (?, ?, ?)',
      ['system', enable ? 'emergency_mode_enabled' : 'emergency_mode_disabled', interaction.user.id]
    );

    const embed = new EmbedBuilder()
      .setColor(enable ? '#e74c3c' : '#2ecc71')
      .setTitle(enable ? '🚨 ' + i18n.t('security.emergency_mode_on') : '✅ ' + i18n.t('security.emergency_mode_off'))
      .setDescription(enable 
        ? '**تم تفعيل وضع الطوارئ:**\n• تم إيقاف جميع الأنظمة التلقائية\n• تم تفعيل الحماية القصوى\n• يُسمح فقط للمسؤولين بالإجراءات'
        : '**تم إيقاف وضع الطوارئ:**\n• عودة الأنظمة للعمل الطبيعي'
      )
      .setTimestamp()
      .setFooter({ text: `بواسطة ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });

    // Announce to all channels if emergency mode is enabled
    if (enable) {
      const announcement = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🚨 تنبيه: تم تفعيل وضع الطوارئ')
        .setDescription('تم تفعيل وضع الطوارئ في السيرفر. قد تكون بعض الوظائف محدودة مؤقتاً.')
        .setTimestamp();

      // Send to system channel if configured
      // In full implementation, this would send to configured announcement channels
    }
  },
};
