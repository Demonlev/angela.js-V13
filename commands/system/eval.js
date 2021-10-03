const { MessageEmbed, CommandInteraction } = require('discord.js');
const Client = require('../../index').Client;
const { sysColor, getEmotion } = require('../../angImg');

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  try {
    const code = await eval(inter.options.getString('код'));

    return await inter.reply({ content: String(code), ephemeral: false });
  } catch (error) {
    console.log(error);
    return await inter.reply({
      content: '```js\n' + String(error).slice(0, 1000) + '```',
      ephemeral: true
    });
  }
};

module.exports.help = {
  name: 'eval',
  permission: []
};
