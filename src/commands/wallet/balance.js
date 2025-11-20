import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('رصيدي')
    .setDescription('عرض رصيد محفظتك')
    .addUserOption(option =>
      option
        .setName('المستخدم')
        .setDescription('عرض رصيد مستخدم آخر')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('المستخدم') || interaction.user;

    // Get or create wallet
    let wallet = database.get(
      'SELECT * FROM wallets WHERE user_id = ?',
      [targetUser.id]
    );

    if (!wallet) {
      database.run(
        'INSERT INTO wallets (user_id, balance) VALUES (?, 0)',
        [targetUser.id]
      );
      wallet = { 
        balance: 0, 
        total_earned: 0, 
        total_spent: 0,
        savings_mode: 0 
      };
    }

    // Get recent transactions
    const recentTransactions = database.all(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [targetUser.id]
    );

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('💰 ' + i18n.t('wallet.balance', { amount: wallet.balance.toLocaleString('ar-SA') }))
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '👤 المستخدم', value: targetUser.tag, inline: true },
        { name: '💰 الرصيد الحالي', value: `${wallet.balance.toLocaleString('ar-SA')} كريدت`, inline: true },
        { name: '📊 إجمالي المكسب', value: `${wallet.total_earned.toLocaleString('ar-SA')} كريدت`, inline: true },
        { name: '💸 إجمالي الإنفاق', value: `${wallet.total_spent.toLocaleString('ar-SA')} كريدت`, inline: true },
        { name: '🔒 وضع الادخار', value: wallet.savings_mode ? 'مفعّل' : 'معطّل', inline: true }
      );

    if (recentTransactions.length > 0) {
      const transactionsText = recentTransactions.map(t => {
        const emoji = t.type === 'credit' ? '💰' : '💸';
        const sign = t.type === 'credit' ? '+' : '-';
        const date = new Date(t.created_at).toLocaleDateString('ar-SA');
        return `${emoji} ${sign}${t.amount} - ${t.description} (${date})`;
      }).join('\n');

      embed.addFields({
        name: '📜 آخر المعاملات',
        value: transactionsText,
        inline: false
      });
    }

    embed.setTimestamp()
      .setFooter({ text: 'نظام المحفظة والكريدت' });

    await interaction.reply({ embeds: [embed] });
  },
};
