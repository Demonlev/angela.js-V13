const Canvas = require('canvas');
const Client = require('../../index').Client;
const fs = require('fs');
const { MessageAttachment } = require('discord.js');

module.exports.run = async (inter) => {
  let canvas = {};
  canvas.create = Canvas.createCanvas(800, 600);
  canvas.context = canvas.create.getContext('2d');
  canvas.context.fillStyle = '#ffffff';

  await Canvas.loadImage('https://media.discordapp.net/attachments/797762330805010442/876511012252184677/eat.png').then(
    async (img) => {
      canvas.context.drawImage(img, 0, 0, 800, 600);
    }
  );

  const target = inter.options.getUser('цель');
  let target_avatar = null;
  if (target) target_avatar = target.avatarURL({ format: 'jpg', size: 128 });

  const canvasTarget = canvas;
  let buffer = null;

  if (target_avatar == null) {
    await Canvas.loadImage(inter.user.avatarURL({ format: 'jpg', size: 128 })).then(async (img) => {
      canvasTarget.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
      canvasTarget.context.drawImage(img, 342, 88, 128, 128);
    });

    buffer = canvasTarget.create.toBuffer('image/png');
  }

  if (target_avatar != null) {
    await Canvas.loadImage(target_avatar).then(async (img) => {
      canvasTarget.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
      canvasTarget.context.drawImage(img, 342, 88, 128, 128);
    });

    buffer = canvasTarget.create.toBuffer('image/png'); 
  }

  fs.writeFileSync('./temp/eat.png', buffer);

  const file = new MessageAttachment('./temp/eat.png');

  return await inter.reply({ content: 'Жди...', files: [file] });
};

module.exports.help = {
  name: 'eat',
  permission: []
};
