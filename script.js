import { command as help } from './commands/help.js';
import { command as fadechat } from './commands/fadechat.js';

import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const fadeChatChannels = new Set();
const messageHistory = new Map();
const messageQueue = new Map();

client.once(Events.ClientReady, c => {
  console.log(`${c.user.tag}が飛び乗った！`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case help.data.name:
        await help.execute(interaction);
        break;
      case fadechat.data.name:
        await fadechat.execute(interaction, fadeChatChannels, messageQueue, messageHistory); 
        break;
      default:
        console.error(`${interaction.commandName}というコマンドには対応していません。`);
    }
  } catch (error) {
    console.error(error);
    const errorMessage = { content: 'コマンド実行時にエラーが発生しました。', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage).catch(console.error);
    } else {
      await interaction.reply(errorMessage).catch(console.error);
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (fadeChatChannels.has(message.channelId)) {
    if (!messageQueue.has(message.channelId)) {
      messageQueue.set(message.channelId, []);
    }
    const queue = messageQueue.get(message.channelId);
    queue.push(message);

    if (queue.processing) return;
    queue.processing = true;

    while (queue.length > 0) {
      const msg = queue.shift();
      const channelMessages = messageHistory.get(message.channelId) || [];
      const lastMessage = channelMessages[channelMessages.length - 1];

      if (
        lastMessage &&
        lastMessage.embeds[0]?.author?.name === msg.author.username
      ) {
        const updatedDescription = `${lastMessage.embeds[0].description}\n${msg.content}`;
        const updatedEmbed = EmbedBuilder.from(lastMessage.embeds[0])
          .setDescription(updatedDescription);
        await lastMessage.edit({ embeds: [updatedEmbed] });
      } else {
        if (channelMessages.length >= 8) {
          const oldMessage = channelMessages.shift();
          const blackedOutContent = oldMessage.embeds[0].description.replace(/./g, '⬛');
          const blackedOutEmbed = EmbedBuilder.from(oldMessage.embeds[0])
            .setDescription(blackedOutContent)
            .setColor('#777777');
          await oldMessage.edit({ embeds: [blackedOutEmbed] });
        }

        const embed = new EmbedBuilder()
          .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
          .setDescription(msg.content)
          .setColor('#00ff00');
        const embedMessage = await msg.channel.send({ embeds: [embed] });
        channelMessages.push(embedMessage);
        messageHistory.set(message.channelId, channelMessages);
      }

      await msg.delete();
    }

    queue.processing = false;
  }
});

client.login(process.env.TOKEN);

process.on('SIGINT', async () => {
  const embed = new EmbedBuilder()
    .setTitle('フェードチャットが終了しました')
    .setColor('#ff0000');

  for (const channelId of fadeChatChannels) {
    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }

    const channelMessages = messageHistory.get(channelId) || [];
    for (const msg of channelMessages) {
      const blackedOutContent = msg.embeds[0].description.replace(/./g, '⬛');
      const blackedOutEmbed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(blackedOutContent)
        .setColor('#777777');
      await msg.edit({ embeds: [blackedOutEmbed] });
    }
    messageHistory.delete(channelId);
  }
  fadeChatChannels.clear();
  client.destroy();
  process.exit();
});