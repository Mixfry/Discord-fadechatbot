import { REST, Routes } from 'discord.js';
import help from './commands/help.js';
import fadechat from './commands/fadechat.js';

const commands = [
  help.data.toJSON(),
  fadechat.data.toJSON()
];
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: commands },
    );
    console.log('デプロイ成功！');
  } catch (error) {
    console.error('デプロイ中にエラーが発生しました:', error);
  }
})();
