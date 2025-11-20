import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('ban').name)
    .setDescription(i18n.getCommand('ban').description)
    .addUserOption(option =>
      option
        .setName('المستخدم')
        .setDescription('المستخدم المراد حظره')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('السبب')
        .setDescription('سبب الحظر')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('حذف-الرسائل')
        .setDescription('حذف رسائل الأيام الأخيرة (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('المستخدم');
    const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';
    const deleteMessageDays = interaction.options.getInteger('حذف-الرسائل') || 0;

    // Check if target is bannable
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (targetMember) {
      if (!targetMember.bannable) {
        await interaction.reply({
          content: '❌ لا يمكن حظر هذا المستخدم (صلاحيات أعلى)',
          ephemeral: true
        });
        return;
      }

      if (targetMember.id === interaction.user.id) {
        await interaction.reply({
          content: '❌ لا يمكنك حظر نفسك',
          ephemeral: true
        });
        return;
      }
    }

    try {
      // Ban the user
      await interaction.guild.members.ban(targetUser.id, {
        reason: `${reason} | بواسطة: ${interaction.user.tag}`,
        deleteMessageSeconds: deleteMessageDays * 86400
      });

      // Log to database
      database.run(
        'INSERT INTO security_logs (user_id, action, reason, moderator_id) VALUES (?, ?, ?, ?)',
        [targetUser.id, 'ban', reason, interaction.user.id]
      );

      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🔨 ' + i18n.t('security.user_banned', { user: targetUser.tag }))
        .addFields(
          { name: '👤 المستخدم', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '👮 المسؤول', value: interaction.user.tag, inline: true },
          { name: '📝 السبب', value: reason, inline: false }
        )
        .setTimestamp()
        .setThumbnail(targetUser.displayAvatarURL());

      await interaction.reply({ embeds: [embed] });

      // Try to DM the user
      try {
        await targetUser.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('🔨 تم حظرك من السيرفر')
              .setDescription(`**السيرفر:** ${interaction.guild.name}`)
              .addFields({ name: '📝 السبب', value: reason })
              .setTimestamp()
          ]
        });
      } catch (error) {
        // User has DMs disabled
      }

    } catch (error) {
      await interaction.reply({
        content: `❌ فشل حظر المستخدم: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
