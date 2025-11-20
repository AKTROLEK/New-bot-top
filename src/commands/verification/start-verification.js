import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('start_verification').name)
    .setDescription(i18n.getCommand('start_verification').description)
    .addUserOption(option =>
      option
        .setName('المستخدم')
        .setDescription('المستخدم المراد تفعيله')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check if user has verification staff role
    // This is a simplified check - in full implementation, check against config
    if (!interaction.member.permissions.has('ManageRoles')) {
      await interaction.reply({
        content: i18n.t('general.no_permission'),
        ephemeral: true
      });
      return;
    }

    const targetUser = interaction.options.getUser('المستخدم');

    // Check if already verified
    const existingVerification = database.get(
      'SELECT * FROM verification_tests WHERE user_id = ? AND passed = 1',
      [targetUser.id]
    );

    if (existingVerification) {
      await interaction.reply({
        content: i18n.t('verification.already_verified'),
        ephemeral: true
      });
      return;
    }

    // Create verification panel with Pass/Fail buttons
    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('📝 لوحة التفعيل')
      .setDescription(`تفعيل المستخدم: ${targetUser}`)
      .addFields(
        { name: '👤 المستخدم', value: targetUser.tag, inline: true },
        { name: '🆔 المعرف', value: targetUser.id, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `بواسطة ${interaction.user.tag}` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_pass:${targetUser.id}`)
          .setLabel(i18n.t('verification.test_button_pass'))
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`verify_fail:${targetUser.id}`)
          .setLabel(i18n.t('verification.test_button_fail'))
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    await interaction.reply({ embeds: [embed], components: [row] });

    // Add to verification queue if not exists
    const inQueue = database.get(
      'SELECT * FROM verification_queue WHERE user_id = ?',
      [targetUser.id]
    );

    if (!inQueue) {
      database.run(
        'INSERT INTO verification_queue (user_id, waiting_room_id, status) VALUES (?, ?, ?)',
        [targetUser.id, 'manual', 'testing']
      );
    }
  },
};
