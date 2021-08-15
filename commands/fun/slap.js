const Canvas = require('canvas');
const Client = require('../../index').Client;
const fs = require('fs');
const { MessageAttachment } = require('discord.js');

module.exports.run = async (inter) => {
  let canvas = {};
  canvas.create = Canvas.createCanvas(1000, 730);
  canvas.context = canvas.create.getContext('2d');
  canvas.context.fillStyle = '#ffffff';

  await Canvas.loadImage('https://cdn.discordapp.com/attachments/797762330805010442/876513514204827729/slap.png').then(
    async (img) => {
      canvas.context.drawImage(img, 0, 0, 1000, 730);
    }
  );

  const target = inter.options.getUser('цель');
  let target_avatar = null;
  if (target) target_avatar = target.avatarURL({ format: 'jpg', size: 128 });

  const bonker = inter.options.getUser('шлёпальщик');
  let bonker_avatar = null;
  if (bonker) bonker_avatar = bonker.avatarURL({ format: 'jpg', size: 128 });

  const canvasTarget = canvas;
  let canvasBonker = null;
  let buffer = null;

  if (target_avatar == null) {
    await Canvas.loadImage(inter.user.avatarURL({ format: 'jpg', size: 128 })).then(async (img) => {
      canvasTarget.context.fillStyle = '#ffffff';
      canvasTarget.context.drawImage(img, 354, 512, 128, 128);
    });

    canvasBonker = canvasTarget;

    await Canvas.loadImage(Client.user.avatarURL({ format: 'jpg', size: 128 })).then(async (img) => {
      canvasBonker.context.fillStyle = '#ffffff';
      canvasBonker.context.drawImage(img, 402, 221, 128, 128);
    });

    buffer = canvasBonker.create.toBuffer('image/png');
  }

  if (target_avatar != null) {
    await Canvas.loadImage(target_avatar).then(async (img) => {
      canvasTarget.context.fillStyle = '#ffffff';
      canvasTarget.context.drawImage(img, 354, 512, 128, 128);
    });

    buffer = canvasTarget.create.toBuffer('image/png');

    if (bonker_avatar != null) {
      canvasBonker = canvasTarget;
      await Canvas.loadImage(bonker_avatar).then(async (img) => {
        canvasBonker.context.fillStyle = '#ffffff';
        canvasBonker.context.drawImage(img, 402, 221, 128, 128);
      });

      buffer = canvasBonker.create.toBuffer('image/png');
    }
  }

  fs.writeFileSync('./temp/slap.png', buffer);

  const file = new MessageAttachment('./temp/slap.png');

  return await inter.reply({ content: 'Получай по попе!', files: [file] });
};

module.exports.help = {
  name: 'slap',
  permission: []
};
