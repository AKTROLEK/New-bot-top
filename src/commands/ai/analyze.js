import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('analyze').name)
    .setDescription(i18n.getCommand('analyze').description)
    .addStringOption(option =>
      option
        .setName('النص')
        .setDescription('النص المراد تحليله')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!config.ai.enabled) {
      await interaction.reply({
        content: '❌ ميزة الذكاء الاصطناعي غير مفعّلة',
        ephemeral: true
      });
      return;
    }

    const text = interaction.options.getString('النص');

    await interaction.deferReply();

    try {
      // Demo analysis (in real implementation, use AI API)
      const wordCount = text.split(' ').length;
      const charCount = text.length;
      const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      
      // Simple sentiment analysis
      const positiveWords = ['جيد', 'ممتاز', 'رائع', 'مذهل', 'سعيد', 'محظوظ'];
      const negativeWords = ['سيء', 'فظيع', 'حزين', 'غاضب', 'سلبي'];
      
      const positiveCount = positiveWords.filter(word => text.includes(word)).length;
      const negativeCount = negativeWords.filter(word => text.includes(word)).length;
      
      let sentiment = 'محايد 😐';
      if (positiveCount > negativeCount) sentiment = 'إيجابي 😊';
      if (negativeCount > positiveCount) sentiment = 'سلبي 😔';

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('📊 ' + i18n.t('ai.content_analyzed', { analysis: 'تحليل النص' }))
        .addFields(
          { name: '📝 عدد الكلمات', value: String(wordCount), inline: true },
          { name: '🔤 عدد الأحرف', value: String(charCount), inline: true },
          { name: '📄 عدد الجمل', value: String(sentenceCount), inline: true },
          { name: '💭 المشاعر', value: sentiment, inline: true },
          { name: '⏱️ وقت القراءة المقدر', value: `${Math.ceil(wordCount / 200)} دقيقة`, inline: true },
          { name: '📈 مستوى الوضوح', value: wordCount < 50 ? 'مختصر جداً' : wordCount < 200 ? 'مختصر' : 'مفصّل', inline: true }
        )
        .setFooter({ text: 'تحليل مدعوم بالذكاء الاصطناعي' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error analyzing text:', error);
      await interaction.editReply({
        content: i18n.t('general.error')
      });
    }
  },
};
