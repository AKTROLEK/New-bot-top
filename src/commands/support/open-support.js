import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import database from '../../models/database.js';
import { v4 as uuidv4 } from 'uuid';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('open_support').name)
    .setDescription(i18n.getCommand('open_support').description)
    .addStringOption(option =>
      option
        .setName('الموضوع')
        .setDescription('موضوع المشكلة')
        .setRequired(true)
        .addChoices(
          { name: 'مشكلة تقنية', value: 'technical' },
          { name: 'استفسار عام', value: 'general' },
          { name: 'مشكلة في السيرفر', value: 'server' },
          { name: 'شكوى', value: 'complaint' },
          { name: 'أخرى', value: 'other' }
        )
    )
    .addStringOption(option =>
      option
        .setName('الوصف')
        .setDescription('وصف المشكلة بالتفصيل')
        .setRequired(true)
    ),

  async execute(interaction) {
    const category = interaction.options.getString('الموضوع');
    const description = interaction.options.getString('الوصف');

    // Generate unique case ID
    const caseId = uuidv4().split('-')[0].toUpperCase();

    // Create support case in database
    database.run(
      'INSERT INTO support_cases (case_id, user_id, category, status) VALUES (?, ?, ?, ?)',
      [caseId, interaction.user.id, category, 'open']
    );

    // Add to support queue
    database.run(
      'INSERT INTO support_queue (user_id, waiting_room_id) VALUES (?, ?)',
      [interaction.user.id, 'default']
    );

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('📂 ' + i18n.t('support.case_opened', { caseId }))
      .setDescription(i18n.t('support.queue_joined'))
      .addFields(
        { name: '🆔 رقم الحالة', value: caseId, inline: true },
        { name: '📂 الفئة', value: getCategoryName(category), inline: true },
        { name: '📝 الوصف', value: description }
      )
      .setTimestamp()
      .setFooter({ text: 'نظام الدعم التلقائي' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Find available staff and assign
    setTimeout(() => assignStaff(caseId, interaction), 1000);
  },
};

function getCategoryName(category) {
  const categories = {
    'technical': '🔧 مشكلة تقنية',
    'general': '💬 استفسار عام',
    'server': '🖥️ مشكلة في السيرفر',
    'complaint': '⚠️ شكوى',
    'other': '📌 أخرى'
  };
  return categories[category] || category;
}

async function assignStaff(caseId, interaction) {
  // This is a simplified version
  // In full implementation, this would check staff availability,
  // current workload, and route to appropriate support room
  
  // For now, just update the case status
  database.run(
    'UPDATE support_cases SET status = ? WHERE case_id = ?',
    ['waiting', caseId]
  );

  // In real implementation, this would:
  // 1. Check staff_status table for available staff
  // 2. Move user to appropriate voice/text channel
  // 3. Assign staff member
  // 4. Notify both parties
}
