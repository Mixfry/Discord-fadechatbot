import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('使い方を説明します'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('BOTの使い方')
        .setDescription(`
使い方: /FadeChat [Start/End]
- Start: フェードチャットを開始します
- End: フェードチャットを終了します
          `)
        .setColor('#00ff00');
      await interaction.reply({ embeds: [embed] });
  }
};

export default command;