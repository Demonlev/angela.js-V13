import { CommandInteraction, Message } from "discord.js";
import path from "node:path";

type sysColorType = "green" | "yellow" | "red";
export function sysColor(type: sysColorType) {
  let color = "https://media.discordapp.net/attachments/797762330805010442/839942525967400990/footer_icon.png";
  if (type === "green") color = "https://media.discordapp.net/attachments/797762330805010442/839942654020157540/modules.png";
  if (type === "yellow") color = "https://media.discordapp.net/attachments/797762330805010442/839942651423490149/help.png";
  if (type === "red") color = "https://media.discordapp.net/attachments/797762330805010442/839942525967400990/footer_icon.png";
  return color;
}
type getEmotionType = "stand" | "watching" | "random" | "facepalm";
export function getEmotion(type: getEmotionType) {
  let emotion = "https://media.discordapp.net/attachments/797762330805010442/839942519918952500/Astand.png";
  if (type === "random") {
    const rand = Math.floor(Math.random() * 2) + 0;
    if (rand === 0) {
      emotion = "https://media.discordapp.net/attachments/797762330805010442/839942519918952500/Astand.png";
    } else {
      emotion = "https://media.discordapp.net/attachments/797762330805010442/839942515900809246/Alooing.png";
    }
  }
  if (emotion === "stand")
    emotion = "https://media.discordapp.net/attachments/797762330805010442/839942519918952500/Astand.png";
  if (emotion === "watching")
    emotion = "https://media.discordapp.net/attachments/797762330805010442/839942515900809246/Alooing.png";
  if (emotion === "facepalm")
    emotion = "https://media.discordapp.net/attachments/797762330805010442/839942513560911922/Afacepalm.png";

  return emotion;
}

export const __globaldirname = path.join(__dirname, "..");

export function isNum(str: any) {
  const num = Number(str);
  return !isNaN(num);
}

export async function findError(inter: CommandInteraction, msg?: string, oopsRemove?: boolean, instant?: boolean) {
  try {
    return await inter
      .editReply({ content: `${oopsRemove ? "" : "Упс!"} ${msg ? msg : "Кажется ничего не найдено..."}` })
      .then((msg) => {
        if (instant === true) {
          try {
            (msg as Message).delete();
            return;
          } catch (error) {}
        }
        (msg as Message)
          .react("🔟")
          .then((msg) => {
            setTimeout(() => {
              msg.message
                .react("5️⃣")
                .then((msg) => {
                  setTimeout(() => {
                    msg.message
                      .react(getRandomEmoji())
                      .then((msg) => {
                        msg.message
                          .react("🔫")
                          .then((msg) => {
                            setTimeout(() => {
                              msg.message.delete().catch((e) => {});
                            }, 1500);
                          })
                          .catch((e) => {});
                      })
                      .catch((e) => {});
                  }, 4000);
                })
                .catch((e) => {});
            }, 5000);
          })
          .catch((e) => {});
      })
      .catch((e) => {});
  } catch (error) {}
}

function getRandomEmoji() {
  const emojis = ["😉", "🙃", "😃", "😢", "🎃", "🤖", "🤡"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export function isValidHttpUrl(str: string) {
  let url;

  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
