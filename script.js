import { command as help } from './commands/help.js';
import { command as fadechat } from './commands/fadechat.js';

import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const fadeChatChannels = new Set();
const messageHistory = new Map();
const cooldowns = new Map();

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
        await fadechat.execute(interaction, fadeChatChannels, messageHistory);
        break;
      default:
        console.error(`${interaction.commandName}というコマンドには対応していません。`);
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      try {
        await interaction.followUp({ content: 'コマンド実行時にエラーが発生しました。', ephemeral: true });
      } catch (followUpError) {
        console.error('フォローアップ中にエラーが発生しました:', followUpError);
      }
    } else {
      try {
        await interaction.reply({ content: 'コマンド実行時にエラーが発生しました。', ephemeral: true });
      } catch (replyError) {
        console.error('リプライ中にエラーが発生しました:', replyError);
      }
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (fadeChatChannels.has(message.channelId)) {
    const now = Date.now();
    const cooldownAmount = 100; // 0.1秒のクールタイム

    if (cooldowns.has(message.channelId)) {
      const expirationTime = cooldowns.get(message.channelId) + cooldownAmount;
      if (now < expirationTime) {
        return;
      }
    }

    cooldowns.set(message.channelId, now);

    const channelMessages = messageHistory.get(message.channelId) || [];
    const lastMessage = channelMessages[channelMessages.length - 1];

    if (lastMessage && lastMessage.embeds[0].author.name === message.author.username) {
      const updatedDescription = `${lastMessage.embeds[0].description}\n${message.content}`;
      const updatedEmbed = new EmbedBuilder(lastMessage.embeds[0])
        .setDescription(updatedDescription);
      await lastMessage.edit({ embeds: [updatedEmbed] });
    } else {
      if (channelMessages.length >= 10) {
        const oldMessage = channelMessages.shift();
        const blackedOutContent = oldMessage.embeds[0].description.replace(/./g, '⬛');
        const blackedOutEmbed = new EmbedBuilder(oldMessage.embeds[0])
          .setDescription(blackedOutContent);
        await oldMessage.edit({ embeds: [blackedOutEmbed] });
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setDescription(message.content)
        .setColor('#00ff00');
      const embedMessage = await message.channel.send({ embeds: [embed] });
      channelMessages.push(embedMessage);
    }

    await message.delete();
    messageHistory.set(message.channelId, channelMessages);
  }
});

client.login(process.env.TOKEN);