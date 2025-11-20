import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';

export default async function handleVerifyFail(interaction, params) {
  const [userId] = params;

  // Show modal to get rejection reason
  const modal = new ModalBuilder()
    .setCustomId(`verify_fail_modal:${userId}`)
    .setTitle('سبب الرفض');

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('يرجى إدخال سبب رفض المستخدم')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('مثال: لم يجتز الاختبار، إجابات غير صحيحة، الخ...')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(500);

  const row = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}
