import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { canStalk } from "./events/handlers.js";

puppeteer.use(StealthPlugin())

const __dirname = path.resolve();
const TEMPLATES_DIR_PATH = path.join(__dirname, "templates");

const get_templates_jsons = async (username) => {
  const processed_jsons = [];
  const templates_files = fs.readdirSync(TEMPLATES_DIR_PATH);
  try {
    templates_files.forEach((templates_file) => {
      const file_path = path.join(TEMPLATES_DIR_PATH, templates_file);
      const raw_data = fs.readFileSync(file_path).toString();
      const processed_data = raw_data.replace(/\$\{username\}/g, username);
      const processed_json = JSON.parse(processed_data);
      processed_jsons.push(processed_json);
    });
  } catch (err) {}
  return processed_jsons;
};

const getWayback = async (url) => {
  const encoded_url = encodeURIComponent(url);
  const wayback_url = `http://web.archive.org/cdx/search/cdx?output=json&url=${encoded_url}`;
  const response = await fetch(wayback_url);
  const data = await response.json();
  return [data.length, wayback_url];
};

const makeMessageObj = (
  site_name,
  site_url,
  hit,
  wayback_count,
  wayback_url,
  error
) => {
  return {
    topic: "stalkResult",
    obj: {
      site_name,
      site_url,
      hit,
      wayback_count,
      wayback_url,
      error,
    },
  };
};

const stalk = async (ws, username) => {
  ws.send(JSON.stringify({ topic: "clearResults" }));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const templates_jsons = await get_templates_jsons(username);
  for (const templates_json of templates_jsons) {
    if (!canStalk) {
      ws.send(JSON.stringify({ topic: "stalkCancelled" }));
      return;
    }

    await page.goto(templates_json["url"], { waitUntil: "networkidle2" });

    let element;
    try {
      await page.waitForSelector(templates_json["elem_query_selector"]), {visible: true, hidden: false};
      element = await page.$(templates_json["elem_query_selector"]);
    } catch (e) {
        console.log(e)
        const message = makeMessageObj(templates_json["name"], templates_json["url"], false, 0, "-", "no element found");
        ws.send(JSON.stringify(message));
        continue;
    }

    const text_content = await page.evaluate((el) => el.textContent, element);
    if (
      !text_content
        .toLowerCase()
        .includes(templates_json["elem_contains_content"].toLowerCase())
    ) {
      const message = makeMessageObj(
        templates_json["name"],
        templates_json["url"],
        false,
        0,
        "-",
        "element does not contain content"
      );
      ws.send(JSON.stringify(message));
      element.dispose();
      continue;
    }
    const [wayback_count, wayback_url] = await getWayback(
      templates_json["url"]
    );
    const message = makeMessageObj(
      templates_json["name"],
      templates_json["url"],
      true,
      wayback_count,
      wayback_count > 0 ? wayback_url : "-",
      "-"
    );
    ws.send(JSON.stringify(message));
    element.dispose();
  }
  browser.close();
  ws.send(JSON.stringify({ topic: "stalkDone" }));
};

export { stalk };
