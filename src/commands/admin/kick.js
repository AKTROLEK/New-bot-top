import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('kick').name)
    .setDescription(i18n.getCommand('kick').description)
    .addUserOption(option =>
      option
        .setName('المستخدم')
        .setDescription('المستخدم المراد طرده')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('السبب')
        .setDescription('سبب الطرد')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('المستخدم');
    const reason = interaction.options.getString('السبب') || 'لم يتم تحديد سبب';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      await interaction.reply({
        content: '❌ المستخدم غير موجود في السيرفر',
        ephemeral: true
      });
      return;
    }

    if (!targetMember.kickable) {
      await interaction.reply({
        content: '❌ لا يمكن طرد هذا المستخدم (صلاحيات أعلى)',
        ephemeral: true
      });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({
        content: '❌ لا يمكنك طرد نفسك',
        ephemeral: true
      });
      return;
    }

    try {
      // Try to DM before kicking
      try {
        await targetUser.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#e67e22')
              .setTitle('👢 تم طردك من السيرفر')
              .setDescription(`**السيرفر:** ${interaction.guild.name}`)
              .addFields({ name: '📝 السبب', value: reason })
              .setTimestamp()
          ]
        });
      } catch (error) {
        // User has DMs disabled
      }

      // Kick the user
      await targetMember.kick(`${reason} | بواسطة: ${interaction.user.tag}`);

      // Log to database
      database.run(
        'INSERT INTO security_logs (user_id, action, reason, moderator_id) VALUES (?, ?, ?, ?)',
        [targetUser.id, 'kick', reason, interaction.user.id]
      );

      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('👢 ' + i18n.t('security.user_kicked', { user: targetUser.tag }))
        .addFields(
          { name: '👤 المستخدم', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '👮 المسؤول', value: interaction.user.tag, inline: true },
          { name: '📝 السبب', value: reason, inline: false }
        )
        .setTimestamp()
        .setThumbnail(targetUser.displayAvatarURL());

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      await interaction.reply({
        content: `❌ فشل طرد المستخدم: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
