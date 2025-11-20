import { EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default async function handleVerifyFailModal(interaction, params) {
  const [userId] = params;
  const reason = interaction.fields.getTextInputValue('reason');

  try {
    // Record the test result
    database.run(
      'INSERT INTO verification_tests (user_id, staff_id, score, passed, answers) VALUES (?, ?, ?, ?, ?)',
      [userId, interaction.user.id, 0, 0, JSON.stringify({ reason })]
    );

    // Update verification queue
    database.run(
      'UPDATE verification_queue SET status = ? WHERE user_id = ?',
      ['failed', userId]
    );

    // Get the user
    const user = await interaction.client.users.fetch(userId);

    // Send failure message to user via DM
    try {
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ ' + i18n.t('verification.test_failed', { reason }))
            .setDescription('يمكنك المحاولة مرة أخرى بعد مراجعة المعلومات')
            .addFields({
              name: '📝 السبب',
              value: reason
            })
            .setTimestamp()
        ]
      });
    } catch (error) {
      // User has DMs disabled
    }

    // Update the panel
    const failEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ تم الرفض')
      .setDescription(`تم رفض ${user.tag}`)
      .addFields(
        { name: '👤 المستخدم', value: user.tag, inline: true },
        { name: '👮 المسؤول', value: interaction.user.tag, inline: true },
        { name: '📝 السبب', value: reason, inline: false }
      )
      .setTimestamp();

    await interaction.update({ embeds: [failEmbed], components: [] });

  } catch (error) {
    console.error('Error in verify_fail_modal handler:', error);
    await interaction.reply({
      content: i18n.t('general.error'),
      ephemeral: true
    });
  }
}
