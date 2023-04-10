import fs from "fs";
import path from "path";
import { Cluster } from "puppeteer-cluster"
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

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 10,
  });

  await cluster.task(async ({ page, data: data }) => {
    await page.setViewport({ width: 1920, height: 1080 });
    if (!canStalk) {
      ws.send(JSON.stringify({ topic: "stalkCancelled" }));
      return;
    }

    await page.goto(data["url"], { waitUntil: "networkidle2" });
    let element;
    try {
      await page.waitForSelector(data["elem_query_selector"]), {visible: true, hidden: false};
      element = await page.$(data["elem_query_selector"]);
    } catch (e) {
      const message = makeMessageObj(data["name"], data["url"], false, 0, "-", "no element found");
      ws.send(JSON.stringify(message));
      return;
    }

    const text_content = await page.evaluate((el) => el.textContent, element);
    if (!text_content.toLowerCase().includes(data["elem_contains_content"].toLowerCase())) {
      const message = makeMessageObj(data["name"], data["url"], false, 0, "-", "element does not contain content" );
      ws.send(JSON.stringify(message));
      element.dispose();
      return;
    }

    const [wayback_count, wayback_url] = await getWayback(data["url"]);
    const message = makeMessageObj(data["name"], data["url"], true, wayback_count, wayback_count > 0 ? wayback_url : "-", "-");
    ws.send(JSON.stringify(message));
    element.dispose();
  });

  const templates_jsons = await get_templates_jsons(username);
  for (const templates_json of templates_jsons) {
    cluster.queue(templates_json);
  }

  await cluster.idle();
  await cluster.close();
  ws.send(JSON.stringify({ topic: "stalkDone" }));
};

export { stalk };
