function getEmotion(type = 'stand' || 'watching' || 'random' || 'facepalm') {
  let emotion = 'https://media.discordapp.net/attachments/797762330805010442/839942519918952500/Astand.png';
  if (type === 'random') {
    const rand = Math.floor(Math.random() * 2) + 0;
    if (rand === 0) {
      emotion = 'https://media.discordapp.net/attachments/797762330805010442/839942519918952500/Astand.png';
    } else {
      emotion = 'https://media.discordapp.net/attachments/797762330805010442/839942515900809246/Alooing.png';
    }
  }
  if (emotion === 'stand')
    emotion = 'https://media.discordapp.net/attachments/797762330805010442/839942519918952500/Astand.png';
  if (emotion === 'watching')
    emotion = 'https://media.discordapp.net/attachments/797762330805010442/839942515900809246/Alooing.png';
  if (emotion === 'facepalm')
    emotion = 'https://media.discordapp.net/attachments/797762330805010442/839942513560911922/Afacepalm.png';

  return emotion;
}

function sysColor(type = 'green' || 'yellow' || 'red') {
  let color = 'https://media.discordapp.net/attachments/797762330805010442/839942525967400990/footer_icon.png';
  if (type === 'green')
    color = 'https://media.discordapp.net/attachments/797762330805010442/839942654020157540/modules.png';
  if (type === 'yellow')
    color = 'https://media.discordapp.net/attachments/797762330805010442/839942651423490149/help.png';
  if (type === 'red')
    color = 'https://media.discordapp.net/attachments/797762330805010442/839942525967400990/footer_icon.png';
  return color;
}

module.exports.sysColor = sysColor;
module.exports.getEmotion = getEmotion;
