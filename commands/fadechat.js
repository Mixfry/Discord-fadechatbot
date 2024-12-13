import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('fadechat')
    .setDescription('フェードチャットを開始または終了します')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('アクションを選択してください')
        .setRequired(true)
        .addChoices(
          { name: 'Start', value: 'start' },
          { name: 'End', value: 'end' }
        )),
  async execute(interaction, fadeChatChannels, messageHistory) {
    const action = interaction.options.getString('action');
    const channelId = interaction.channelId;
    let embed;

    if (action === 'start') {
      fadeChatChannels.add(channelId);
      embed = new EmbedBuilder()
        .setTitle('フェードチャットを開始')
        .setColor('#00ff00');
      await interaction.reply({ embeds: [embed] });
    } else if (action === 'end') {
      embed = new EmbedBuilder()
        .setTitle('フェードチャットが終了しました')
        .setColor('#ff0000');
      await interaction.reply({ embeds: [embed] });
      fadeChatChannels.delete(channelId);
      const channelMessages = messageHistory.get(channelId) || [];
      for (const msg of channelMessages) {
        const blackedOutContent = msg.embeds[0].description.replace(/./g, '⬛');
        const blackedOutEmbed = new EmbedBuilder(msg.embeds[0])
          .setDescription(blackedOutContent);
        await msg.edit({ embeds: [blackedOutEmbed] });
      }
      messageHistory.delete(channelId);
    }
  }
};

export default command;