import { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';
import config from '../../config.js';

export default async function handleVerifyPass(interaction, params) {
  const [userId] = params;

  try {
    // Record the test result
    database.run(
      'INSERT INTO verification_tests (user_id, staff_id, score, passed) VALUES (?, ?, ?, ?)',
      [userId, interaction.user.id, 100, 1]
    );

    // Update verification queue
    database.run(
      'UPDATE verification_queue SET status = ? WHERE user_id = ?',
      ['passed', userId]
    );

    // Get the user
    const user = await interaction.client.users.fetch(userId);
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    // Assign verified role if configured
    if (member && config.verification.verifiedRole) {
      const role = interaction.guild.roles.cache.get(config.verification.verifiedRole);
      if (role) {
        await member.roles.add(role);
      }
    }

    // Send success message to user via DM
    try {
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('✅ ' + i18n.t('verification.test_passed'))
            .setDescription(i18n.t('verification.verification_complete'))
            .addFields({
              name: '🎖️ الرتبة الجديدة',
              value: 'عضو مفعّل'
            })
            .setTimestamp()
        ]
      });
    } catch (error) {
      // User has DMs disabled
    }

    // Update the panel
    const successEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ تم القبول')
      .setDescription(`تم قبول ${user.tag} بنجاح`)
      .addFields(
        { name: '👤 المستخدم', value: user.tag, inline: true },
        { name: '👮 المسؤول', value: interaction.user.tag, inline: true },
        { name: '📊 النتيجة', value: 'اجتاز', inline: true }
      )
      .setTimestamp();

    await interaction.update({ embeds: [successEmbed], components: [] });

  } catch (error) {
    console.error('Error in verify_pass handler:', error);
    await interaction.reply({
      content: i18n.t('general.error'),
      ephemeral: true
    });
  }
}
