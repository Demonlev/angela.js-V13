const Canvas = require('canvas');
const Client = require('../../index').Client;
const fs = require('fs');
const { MessageAttachment } = require('discord.js');

module.exports.run = async (inter) => {
  let canvas = {};
  canvas.create = Canvas.createCanvas(1080, 1078);
  canvas.context = canvas.create.getContext('2d');
  canvas.context.fillStyle = '#ffffff';

  await Canvas.loadImage('https://cdn.discordapp.com/attachments/797762330805010442/876513508081156157/aaam.png').then(
    async (img) => {
      canvas.context.drawImage(img, 0, 0, 1080, 1078);
    }
  );

  const target = inter.options.getUser('цель');
  let target_avatar = null;
  if (target) target_avatar = target.avatarURL({ format: 'jpg', size: 256 });

  const canvasTarget = canvas;
  let buffer = null;

  if (target_avatar == null) {
    await Canvas.loadImage(inter.user.avatarURL({ format: 'jpg', size: 256 })).then(async (img) => {
      canvasTarget.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
      canvasTarget.context.drawImage(img, 439, 193, 256, 256);
    });

    buffer = canvasTarget.create.toBuffer('image/png');
  }

  if (target_avatar != null) {
    await Canvas.loadImage(target_avatar).then(async (img) => {
      canvasTarget.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
      canvasTarget.context.drawImage(img, 439, 193, 256, 256);
    });

    buffer = canvasTarget.create.toBuffer('image/png');
  }

  fs.writeFileSync('./temp/aaam.png', buffer);

  const file = new MessageAttachment('./temp/aaam.png');

  return await inter.reply({ content: 'Куш0й...', files: [file] });
};

module.exports.help = {
  name: 'aaam',
  permission: []
};
