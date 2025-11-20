import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import i18n from '../../utils/i18n.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName(i18n.getCommand('title').name)
    .setDescription(i18n.getCommand('title').description)
    .addStringOption(option =>
      option
        .setName('الموضوع')
        .setDescription('الموضوع المراد توليد عنوان له')
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

    const topic = interaction.options.getString('الموضوع');

    await interaction.deferReply();

    try {
      // In a real implementation, this would call OpenAI API
      // For now, we'll create a demo response
      
      const demoTitles = [
        `${topic} - دليل شامل للمبتدئين`,
        `أفضل الممارسات في ${topic}`,
        `كل ما تحتاج معرفته عن ${topic}`,
        `${topic}: نصائح وحيل احترافية`,
        `استكشف ${topic} بطريقة جديدة`
      ];

      const generatedTitle = demoTitles[Math.floor(Math.random() * demoTitles.length)];

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🤖 ' + i18n.t('ai.title_generated', { title: generatedTitle }))
        .addFields(
          { name: '📝 الموضوع المدخل', value: topic, inline: false },
          { name: '✨ العنوان المقترح', value: generatedTitle, inline: false }
        )
        .setFooter({ text: 'مدعوم بالذكاء الاصطناعي' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Note: To enable real AI functionality, uncomment and configure OpenAI:
      // import OpenAI from 'openai';
      // const openai = new OpenAI({ apiKey: config.ai.apiKey });
      // const completion = await openai.chat.completions.create({
      //   model: config.ai.model,
      //   messages: [
      //     { role: 'system', content: 'أنت مساعد ذكي متخصص في توليد عناوين جذابة باللغة العربية' },
      //     { role: 'user', content: `اقترح عنواناً جذاباً للموضوع التالي: ${topic}` }
      //   ],
      // });
      // const aiTitle = completion.choices[0].message.content;

    } catch (error) {
      console.error('Error generating title:', error);
      await interaction.editReply({
        content: i18n.t('general.error')
      });
    }
  },
};
