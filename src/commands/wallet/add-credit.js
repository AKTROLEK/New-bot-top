import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('add_credit').name)
    .setDescription(i18n.getCommand('add_credit').description)
    .addUserOption(option =>
      option
        .setName('المستخدم')
        .setDescription('المستخدم المراد إضافة كريدت له')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('الكمية')
        .setDescription('كمية الكريدت المراد إضافتها')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('السبب')
        .setDescription('سبب إضافة الكريدت')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('المستخدم');
    const amount = interaction.options.getInteger('الكمية');
    const reason = interaction.options.getString('السبب') || 'إضافة يدوية';

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
      wallet = { balance: 0 };
    }

    // Update wallet
    const newBalance = wallet.balance + amount;
    database.run(
      'UPDATE wallets SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [newBalance, amount, targetUser.id]
    );

    // Record transaction
    database.run(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
      [targetUser.id, 'credit', amount, reason]
    );

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ ' + i18n.t('wallet.transaction_added', { amount }))
      .setDescription(`تمت إضافة **${amount}** كريدت إلى ${targetUser}`)
      .addFields(
        { name: '💰 الرصيد الجديد', value: `${newBalance} كريدت`, inline: true },
        { name: '📝 السبب', value: reason, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `بواسطة ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });

    // Send DM to user
    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('💰 ' + i18n.t('streamer.credit_added', { amount }))
            .setDescription(`تم إضافة **${amount}** كريدت إلى محفظتك`)
            .addFields(
              { name: '💰 رصيدك الجديد', value: `${newBalance} كريدت` },
              { name: '📝 السبب', value: reason }
            )
            .setTimestamp()
        ]
      });
    } catch (error) {
      // User has DMs disabled
    }
  },
};
