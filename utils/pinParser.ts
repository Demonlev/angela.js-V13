import puppeteer from "puppeteer";
import { load } from "cheerio";
import { isNum, isValidHttpUrl } from "@utils/utils";

type pinType = null | {
  url?: string;
  title?: string;
  desc?: string;
  img: string;
  isGIF: boolean;
};

type ModeType = "slow" | "medium" | "fast";

export default async function pinParser(query: string, mode: ModeType | null = "medium") {
  if (mode === null || mode === undefined) mode = "medium";
  const sizeVW = mode === "fast" ? 1024 : mode === "medium" ? 1536 : 2048;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", `--window-size=${sizeVW},${sizeVW}`],
    defaultViewport: { width: sizeVW, height: sizeVW },
  });
  let pin: pinType = null;
  try {
    const page = await browser.newPage();
    if (isValidHttpUrl(query)) {
      const idReg = query.match(/\d+/g);
      if (idReg && idReg[0]) {
        pin = await parseByID(idReg[0], page, pin);
      }
    } else if (isNum(query)) {
      const idReg = query.match(/\d+/g);
      if (idReg && idReg[0]) {
        pin = await parseByID(idReg[0], page, pin);
      }
    } else {
      pin = await parseByTags(query, page, pin, mode);
    }
  } catch (error) {
    browser.close();
  } finally {
    browser.close();
  }
  if (pin) return pin;
  return null;
}

async function parseByTags(tags: string, page: puppeteer.Page, pin: pinType, mode: ModeType) {
  const waitUntil = mode === "fast" ? "load" : mode === "medium" ? "networkidle2" : "networkidle0";
  await page.goto(`https://www.pinterest.ru/search/pins/?q=${tags}&rs=typo_auto_original&auto_correction_disabled=true`, {
    waitUntil: waitUntil,
  });
  const bodyHTML = await page.evaluate((mode) => {
    if (mode !== "fast") {
      window.scrollBy(0, window.innerHeight);
    }
    return document.body.innerHTML;
  }, mode);
  const bodyCheerio = load(bodyHTML);
  const items = bodyCheerio("div.Yl-");
  if (items.length !== 0) {
    const itemHTML = items[Math.floor(Math.random() * (items.length - 1))];
    const itemCheerio = load(itemHTML);
    if (itemCheerio.length !== 0) {
      const itemURL = itemCheerio("a.ho-").get(0);
      if (itemURL) {
        const idReg = itemURL.attribs.href.match(/\d+/g);
        if (idReg && idReg[0]) {
          return parseByID(idReg[0], page, pin);
        }
      }
    }
  }
  return null;
}

async function parseByID(id: string, page: puppeteer.Page, pin: pinType) {
  await page.goto(`https://www.pinterest.ru/pin/${id}/`, {
    waitUntil: "networkidle2",
  });
  page.setViewport({ width: 512, height: 512 });
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  const bodyCheerio = load(bodyHTML);
  const itemIMGContainer = bodyCheerio("div.CCY.czT.DUt.iyn.DI9.BG7").get(0);
  const itemTitle = bodyCheerio("div.Hvp.zI7.iyn.Hsu h1 div.sLG.zI7.iyn.Hsu").get(0);
  const itemDesc = bodyCheerio("div.hjj.zI7.iyn.Hsu h2 span").get(0);
  const itemDescSecondary = bodyCheerio("span.richPinInformation span.tBJ.dyH.iFc.j1A.O2T.zDA.IZT.swG").get(0);
  if (itemIMGContainer) {
    const itemIMGContainerCheerio = load(itemIMGContainer);
    const itemIMG = itemIMGContainerCheerio("img.hCL.kVc.L4E.MIw").get(0);
    if (itemIMG) {
      pin = {
        img: "",
        isGIF: false,
        desc: undefined,
        title: undefined,
        url: undefined,
      };
      pin.img = itemIMG.attribs.src;
      pin.url = `https://www.pinterest.ru/pin/${id}/`;
      if (pin.img.endsWith(".gif")) {
        pin.isGIF = true;
      }
      if (itemTitle) {
        if (itemTitle.children[0] && (itemTitle.children[0] as any).data) {
          pin.title = (itemTitle.children[0] as any).data;
        }
      }
      if (itemDesc) {
        if (itemDesc.children[0] && (itemDesc.children[0] as any).data) {
          pin.desc = (itemDesc.children[0] as any).data;
        }
      }
      if (itemDescSecondary) {
        if (itemDescSecondary.children[0] && (itemDescSecondary.children[0] as any).data) {
          pin.desc = (itemDescSecondary.children[0] as any).data;
        }
      }

      return pin;
    }
  }
  return null;
}
