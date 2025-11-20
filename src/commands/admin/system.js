import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';
import os from 'os';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('system').name)
    .setDescription(i18n.getCommand('system').description)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Get system stats
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(2);

    // Get bot stats
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    // Get database stats
    const totalCases = database.get('SELECT COUNT(*) as count FROM support_cases')?.count || 0;
    const activeCases = database.get('SELECT COUNT(*) as count FROM support_cases WHERE status = "open"')?.count || 0;
    const totalStreamers = database.get('SELECT COUNT(*) as count FROM streamers WHERE status = "approved"')?.count || 0;
    const totalUsers = database.get('SELECT COUNT(*) as count FROM wallets')?.count || 0;

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('📊 حالة النظام')
      .addFields(
        { 
          name: '🤖 معلومات البوت', 
          value: `**الوقت النشط:** ${days} يوم، ${hours} ساعة، ${minutes} دقيقة\n**السيرفرات:** ${interaction.client.guilds.cache.size}\n**المستخدمين:** ${interaction.client.users.cache.size}`,
          inline: false
        },
        { 
          name: '💻 معلومات النظام', 
          value: `**النظام:** ${os.platform()} ${os.arch()}\n**الذاكرة:** ${memoryUsage}% مستخدمة\n**Node.js:** ${process.version}`,
          inline: false
        },
        { 
          name: '📈 إحصائيات البوت', 
          value: `**حالات الدعم:** ${totalCases} (${activeCases} نشطة)\n**الستريمرز:** ${totalStreamers}\n**المستخدمين المسجلين:** ${totalUsers}`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'نظام المراقبة والإحصائيات' });

    await interaction.reply({ embeds: [embed] });
  },
};
