module.exports.run = async (inter) => {
  let text = inter.options.getString('текст');
  if (text == null) text = 'А где текст для повтора?';

  return await inter.reply({ content: text });
};

module.exports.help = {
  name: 'echo',
  permission: []
};
