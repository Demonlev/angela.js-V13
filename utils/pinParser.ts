import puppeteer from "puppeteer";
import { load } from "cheerio";
import fs from 'node:fs'
import path from 'node:path'
import { isNum, __globaldirname } from "@utils/utils";

type pinType = null | {
  url?: string;
  title?: string;
  desc?: string;
  img: string;
  isGIF: boolean;
};

const urlMatch =
  /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

export default async function pinParser(query: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--window-size=2048,2048"],
    defaultViewport: { width: 2048, height: 2048 },
  });
  let pin: pinType = null;
  try {
    const page = await browser.newPage();
    if (query.match(urlMatch)) {
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
      pin = await parseByTags(query, page, pin);
    }
  } catch (error) {
    browser.close();
  } finally {
    browser.close();
  }
  if (pin) return pin;
  return null;
}

async function parseByTags(tags: string, page: puppeteer.Page, pin: pinType) {
  await page.goto(`https://www.pinterest.ru/search/pins/?q=${tags}&rs=typo_auto_original&auto_correction_disabled=true`, {
    waitUntil: "networkidle0",
  });
  const bodyHTML = await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
    return document.body.innerHTML;
  });
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
