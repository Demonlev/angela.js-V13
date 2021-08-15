const Canvas = require('canvas');
const Client = require('../../index').Client;
const fs = require('fs');
const { MessageAttachment } = require('discord.js');

module.exports.run = async (inter) => {
  let canvas = {};
  canvas.create = Canvas.createCanvas(680, 461);
  canvas.context = canvas.create.getContext('2d');
  canvas.context.fillStyle = '#ffffff';

  const isHorny = inter.options.getBoolean('хорни');
  let text = 'Боньк тебя!'

  if (isHorny) {
    await Canvas.loadImage(
      'https://media.discordapp.net/attachments/797762330805010442/876508730118766642/bonkHorny.png'
    ).then(async (img) => {
      canvas.context.drawImage(img, 0, 0, 680, 461);
    });
    text = 'Получай, хорни!'
  } else {
    await Canvas.loadImage(
      'https://media.discordapp.net/attachments/797762330805010442/863745338710687744/bonk.png'
    ).then(async (img) => {
      canvas.context.drawImage(img, 0, 0, 680, 461);
    });
  }

  const target = inter.options.getUser('цель');
  let target_avatar = null;
  if (target) target_avatar = target.avatarURL({ format: 'jpg', size: 128 });

  const bonker = inter.options.getUser('бонькер');
  let bonker_avatar = null;
  if (bonker) bonker_avatar = bonker.avatarURL({ format: 'jpg', size: 128 });

  const canvasTarget = canvas;
  let canvasBonker = null;
  let buffer = null;

  if (target_avatar == null) {
    await Canvas.loadImage(inter.user.avatarURL({ format: 'jpg', size: 128 })).then(async (img) => {
      canvasTarget.context.fillStyle = '#ffffff';
      canvasTarget.context.drawImage(img, 414, 242, 128, 128);
    });

    canvasBonker = canvasTarget;

    await Canvas.loadImage(Client.user.avatarURL({ format: 'jpg', size: 128 })).then(async (img) => {
      canvasBonker.context.fillStyle = '#ffffff';
      canvasBonker.context.drawImage(img, 184, 100, 128, 128);
    });

    buffer = canvasBonker.create.toBuffer('image/png');
  }

  if (target_avatar != null) {
    await Canvas.loadImage(target_avatar).then(async (img) => {
      canvasTarget.context.fillStyle = '#ffffff';
      canvasTarget.context.drawImage(img, 414, 242, 128, 128);
    });

    buffer = canvasTarget.create.toBuffer('image/png');

    if (bonker_avatar != null) {
      canvasBonker = canvasTarget;
      await Canvas.loadImage(bonker_avatar).then(async (img) => {
        canvasBonker.context.fillStyle = '#ffffff';
        canvasBonker.context.drawImage(img, 184, 100, 128, 128);
      });

      buffer = canvasBonker.create.toBuffer('image/png');
    }
  }

  fs.writeFileSync('./temp/bonk.png', buffer);

  const file = new MessageAttachment('./temp/bonk.png');

  return await inter.reply({ content: text, files: [file] });
};

module.exports.help = {
  name: 'bonk',
  permission: []
};
