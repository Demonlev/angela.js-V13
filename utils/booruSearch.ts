import xml2js from "xml2js";
import boorus from "json/booru.json";
import { getValidHttpUrl, isValidHttpUrl } from "@utils/utils";
import axios from "axios";

type BooruType = {
  domain: string;
  nsfw: boolean;
  random: boolean;
  data: "json" | "xml";
  api: {
    search: string;
    post: string;
  };
};

type BooruSiteType =
  | "safebooru.org"
  | "api.rule34.xxx"
  | "rule34.paheal.net"
  | "xbooru.com"
  | "tbib.org"
  | "danbooru.donmai.us"
  | "hypnohub.net"
  | "konachan.com"
  | "konachan.net";

type BooruPost = {
  booru: string;
  url: string;
  image: string;
  tags: string[];
  nsfw: boolean;
};

const websites = new Map<string, BooruType>(Object.entries(boorus as unknown as Map<string, BooruType>));

export async function getBooruPost(query: string, site: BooruSiteType | null) {
  const isLink = isValidHttpUrl(query);
  if (site === null) site = "safebooru.org";
  const ws = websites.get(site);

  let post: BooruPost | null = null;

  if (ws && isLink === false && /^\d+$/.test(query) === false) {
    let tags: string;
    switch (site) {
      case "rule34.paheal.net":
        tags = query.split(/\s/g).slice(0, 3).join(" ");
        break;
      case "hypnohub.net":
        tags = query.split(/\s/g).slice(0, 6).join(" ");
        break;
      default:
        tags = query.split(/\s/g).slice(0, 10).join(" ");
        break;
    }
    const url = isLink === false && getValidHttpUrl("http://" + ws.domain + ws.api.search + `tags=${tags}`);

    if (url) {
      const response = await axios.get(url).catch();

      const data = (() => {
        if (typeof response.data === "string") {
          if (ws.data === "xml") {
            return `<?xml version="1.0" encoding="UTF-8" ?>` + response.data;
          } else return response.data;
        } else return response.data;
      })();

      switch (site) {
        default:
        case "safebooru.org":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tags && dataPost.image && dataPost.directory && dataPost.id) {
              post = {
                booru: "SafeBooru ✅",
                image: `https://safebooru.org//images/${dataPost.directory}/${dataPost.image}`,
                tags: (dataPost.tags as string).split(/\s/),
                url: `https://safebooru.org/index.php?page=post&s=view&id=${dataPost.id}`,
                nsfw: false,
              };
            }
          }
          break;
        case "api.rule34.xxx":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tags && dataPost.file_url && dataPost.id) {
              post = {
                booru: "Rule 34 🔞",
                image: dataPost.file_url,
                tags: (dataPost.tags as string).split(/\s/),
                url: `https://rule34.xxx/index.php?page=post&s=view&id=${dataPost.id}`,
                nsfw: true,
              };
            }
          }
          break;
        case "rule34.paheal.net":
          if (typeof data === "string") {
            try {
              const dataParsed = await xml2js.parseStringPromise(data, { explicitChildren: true, ignoreAttrs: false });
              if (dataParsed && dataParsed["posts"] && dataParsed["posts"]["$$"] && dataParsed["posts"]["$$"]["tag"]) {
                const dataPost =
                  dataParsed["posts"]["$$"]["tag"][~~(Math.random() * dataParsed["posts"]["$$"]["tag"].length)]["$"];
                if (dataPost && dataPost.id && dataPost.file_url && dataPost.tags) {
                  post = {
                    booru: "Rule 34 Paheal 🔞",
                    image: dataPost.file_url,
                    tags: (dataPost.tags as string).split(/\s/),
                    url: `https://rule34.paheal.net/post/view/${dataPost.id}`,
                    nsfw: true,
                  };
                }
              }
            } catch (_) {}
          }
          break;
        case "xbooru.com":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tags && dataPost.image && dataPost.directory && dataPost.id) {
              post = {
                booru: "XBooru 🔞",
                image: `https://img.xbooru.com//images/${dataPost.directory}/${dataPost.image}`,
                tags: (dataPost.tags as string).split(/\s/),
                url: `https://xbooru.com/index.php?page=post&s=view&id=${dataPost.id}`,
                nsfw: true,
              };
            }
          }
          break;
        case "tbib.org":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tags && dataPost.image && dataPost.directory && dataPost.id) {
              post = {
                booru: "TBib 🔞",
                image: `https://tbib.org//images/${dataPost.directory}/${dataPost.image}`,
                tags: (dataPost.tags as string).split(/\s/),
                url: `https://tbib.org/index.php?page=post&s=view&id=${dataPost.id}`,
                nsfw: true,
              };
            }
          }
          break;
        case "konachan.com":
        case "konachan.net":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tags && dataPost.file_url && dataPost.id) {
              post = {
                booru: ws.nsfw ? "Konachan 🔞" : "Konachan ✅",
                image: dataPost.file_url,
                tags: (dataPost.tags as string).split(/\s/),
                url: `https://${site}/post/show/${dataPost.id}`,
                nsfw: ws.nsfw,
              };
            }
          }
          break;
        case "danbooru.donmai.us":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tag_string && dataPost.file_url && dataPost.id) {
              post = {
                booru: "danbooru.donmai.us 🔞",
                image: dataPost.file_url,
                tags: (dataPost.tag_string as string).split(/\s/),
                url: `https://danbooru.donmai.us/posts/${dataPost.id}`,
                nsfw: true,
              };
            }
          }
          break;
        case "hypnohub.net":
          if (Array.isArray(data) && data.length > 0) {
            const dataPost = data[~~(Math.random() * data.length)];
            if (dataPost && dataPost.tags && dataPost.file_url && dataPost.id) {
              post = {
                booru: "HypnoHub 🔞",
                image: dataPost.file_url,
                tags: (dataPost.tags as string).split(/\s/),
                url: `https://hypnohub.net/index.php?page=post&s=view&id=${dataPost.id}`,
                nsfw: true,
              };
            }
          }
          break;
      }
    }
  }
  return post;
}
