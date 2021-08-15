module.exports.run = async (inter) => {
  const text = inter.options.getString('текст');
  if (text.length === 0 || text == null) {
    text = ' ';
  }
  return await inter.reply({ content: text });
};

module.exports.help = {
  name: 'echo',
  permission: []
};
