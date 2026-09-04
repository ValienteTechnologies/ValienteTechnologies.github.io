#!/usr/bin/env node
// Reusable visual sweep: screenshots every sitemap page at each given width
// and flags layout defects (horizontal overflow, clipped text, the navbar
// toggler breakpoint, fixed elements over the footer, broken images,
// console/network errors). Tools are unpinned: playwright-core resolves
// from PLAYWRIGHT_CORE, chromium from CHROME_PATH (defaults below).
//
// Usage: node scripts/visual-sweep.js --base http://localhost:4090 --out <dir>
//        [--widths 360,390,1280] [--pages /,/en/] [--fallback]

"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");

function parseArgs(argv) {
  const args = { widths: [360, 390, 1280], out: null, base: null, pages: null, fallback: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") args.base = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--widths") args.widths = argv[++i].split(",").map(Number);
    else if (a === "--pages") args.pages = argv[++i].split(",");
    else if (a === "--fallback") args.fallback = true;
  }
  return args;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// Reads <base>/sitemap.xml, keeps page paths only (host stripped, .pdf skipped).
async function getPages(base) {
  const xml = await fetchUrl(base.replace(/\/$/, "") + "/sitemap.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = locs
    .map((l) => { try { return new URL(l).pathname; } catch (_) { return null; } })
    .filter((p) => p && !p.toLowerCase().endsWith(".pdf"));
  return [...new Set(paths)];
}

function slugify(p) {
  return p.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home";
}

function deviceConfig(width) {
  const mobile = width < 768;
  return { viewport: { width, height: mobile ? 780 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 };
}

// Browser-side checks, run via page.evaluate(runChecks, phase).
// phase "top": scrollWidth, clipped/overflowing text, navbar toggler, images.
// phase "bottom": position:fixed elements overlapping the footer (call after
// scrolling to the page bottom). One function so both phases share cssPath.
function runChecks(phase) {
  function cssPath(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + el.id;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 4) {
      let sel = node.tagName.toLowerCase();
      const cls = typeof node.className === "string" ? node.className.trim().split(/\s+/)[0] : "";
      if (cls) sel += "." + cls;
      parts.unshift(sel);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }
  function isVisible(el) {
    if (!el) return false;
    if (el.hasAttribute && el.hasAttribute("hidden")) return false;
    if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  if (phase === "bottom") {
    // Fixed elements colliding with the footer. The lang-nudge banner is
    // exempt only when body carries has-lang-nudge with a matching
    // padding-bottom (i.e. it has actually reserved the space it occupies).
    const footer = document.querySelector("footer") || document.querySelector(".footer");
    if (!footer) return [];
    const fr = footer.getBoundingClientRect();
    const overlaps = [];
    document.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed" || !isVisible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (!(r.bottom > fr.top && r.top < fr.bottom && r.right > fr.left && r.left < fr.right)) return;
      if (el.id === "langNudge") {
        const pad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
        if (document.body.classList.contains("has-lang-nudge") && Math.abs(pad - r.height) < 4) return;
      }
      overlaps.push({ selector: cssPath(el), id: el.id, className: typeof el.className === "string" ? el.className : "" });
    });
    return overlaps;
  }

  // phase "top"
  function nearestBlock(el) {
    for (let node = el; node; node = node.parentElement) {
      if (getComputedStyle(node).display !== "inline") return node;
    }
    return document.body;
  }
  function hasClippingAncestor(el) {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (/(hidden|auto|scroll)/.test(cs.overflow + cs.overflowX + cs.overflowY)) return true;
    }
    return false;
  }

  const textOverflows = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let el = node.parentElement; el; el = el.parentElement) {
        if (!isVisible(el)) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) {
    const parentEl = n.parentElement;
    if (hasClippingAncestor(parentEl)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 || r.height > 0);
    if (!rects.length) continue;
    const maxRight = Math.max(...rects.map((r) => r.right));
    const minLeft = Math.min(...rects.map((r) => r.left));
    const block = nearestBlock(parentEl);
    const bcs = getComputedStyle(block);
    const brect = block.getBoundingClientRect();
    const blockRight = brect.right - (parseFloat(bcs.borderRightWidth) || 0);
    const blockLeft = brect.left + (parseFloat(bcs.borderLeftWidth) || 0);
    const overBlock = maxRight - blockRight > 1 || blockLeft - minLeft > 1;
    const overViewport = maxRight - window.innerWidth > 1 || minLeft < -1;
    if (overBlock || overViewport) {
      textOverflows.push({
        selector: cssPath(parentEl), text: n.nodeValue.trim().slice(0, 60),
        maxRight: Math.round(maxRight), minLeft: Math.round(minLeft),
        blockRight: Math.round(blockRight), blockLeft: Math.round(blockLeft),
        overBlock, overViewport,
      });
    }
  }

  const toggler = document.querySelector(".navbar-toggler");
  let navToggler = null;
  if (toggler) {
    const shouldHide = window.innerWidth >= 992;
    const isHidden = getComputedStyle(toggler).display === "none";
    navToggler = { width: window.innerWidth, shouldHide, isHidden, pass: shouldHide === isHidden };
  }

  const images = [...document.images]
    .map((img) => ({
      src: img.currentSrc || img.src,
      hasDims: img.hasAttribute("width") && img.hasAttribute("height"),
      broken: img.complete && img.naturalWidth === 0,
    }))
    .filter((i) => i.broken || !i.hasDims);

  return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, textOverflows, navToggler, images };
}

async function capturePage(ctx, base, pagePath, width, variant, outDir) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  // The fallback variant blocks .woff2 itself (see main); those aborts surface as
  // ERR_BLOCKED_BY_CLIENT and are expected, not findings.
  const isOwnFontBlock = (text, url) =>
    variant === "fallback" && /ERR_BLOCKED_BY_CLIENT/.test(text) && /\.woff2(\?|$)/.test(url);
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const url = (msg.location() && msg.location().url) || "";
    if (!isOwnFontBlock(msg.text(), url)) consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.includes("googletagmanager")) return;
    const f = req.failure();
    const error = f ? f.errorText : "unknown";
    if (isOwnFontBlock(error, url)) return;
    failedRequests.push({ url, error });
  });

  const prefix = `${slugify(pagePath)}__${width}${variant === "fallback" ? "-fallback" : ""}`;
  await page.goto(base.replace(/\/$/, "") + pagePath, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(800); // settle: networkidle never resolves here (GA beacon)

  await page.screenshot({ path: path.join(outDir, `${prefix}-top.png`) });
  await page.screenshot({ path: path.join(outDir, `${prefix}-full.png`), fullPage: true });

  const checks = await page.evaluate(runChecks, "top");
  checks.horizontalOverflow = checks.scrollWidth - checks.innerWidth > 1;

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(150);
  checks.fixedOverlaps = await page.evaluate(runChecks, "bottom");
  await page.evaluate(() => window.scrollTo(0, 0));

  const extra = {};
  if (variant === "normal" && (pagePath === "/" || pagePath === "/en/") && width < 992) {
    const toggler = await page.$(".navbar-toggler");
    if (toggler) {
      await toggler.click();
      await page.waitForSelector(".navbar-collapse.show", { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(outDir, `${prefix}-menu.png`) });
      extra.menu = `${prefix}-menu.png`;
    }
  }
  if (variant === "normal" && (pagePath === "/corporate/" || pagePath === "/en/corporate/")) {
    const trigger = await page.$(".brochures-card");
    if (trigger) {
      await trigger.click();
      await page.waitForSelector(".modal.show", { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(outDir, `${prefix}-modal.png`) });
      extra.modal = `${prefix}-modal.png`;
    }
  }

  checks.consoleErrors = consoleErrors;
  checks.failedRequests = failedRequests;
  await page.close();
  return { page: pagePath, width, variant, checks, extra, screenshots: { top: `${prefix}-top.png`, full: `${prefix}-full.png` } };
}

function recordPasses(c) {
  return !(c.horizontalOverflow || c.textOverflows.length || (c.navToggler && !c.navToggler.pass) ||
    c.images.length || c.fixedOverlaps.length || c.consoleErrors.length || c.failedRequests.length);
}

function report(results, outDir) {
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(results, null, 2));
  let anyFail = false;
  console.log("\n" + "Page".padEnd(28) + "Width".padEnd(8) + "Variant".padEnd(10) + "Result");
  for (const r of results) {
    const pass = recordPasses(r.checks);
    if (!pass) anyFail = true;
    console.log(r.page.padEnd(28) + String(r.width).padEnd(8) + r.variant.padEnd(10) + (pass ? "PASS" : "FAIL"));
    if (pass) continue;
    const c = r.checks;
    if (c.horizontalOverflow) console.log(`    overflow: scrollWidth=${c.scrollWidth} innerWidth=${c.innerWidth}`);
    c.textOverflows.forEach((t) => console.log(`    text-overflow: ${t.selector} "${t.text}"`));
    if (c.navToggler && !c.navToggler.pass) console.log(`    navToggler: width=${c.navToggler.width} shouldHide=${c.navToggler.shouldHide} isHidden=${c.navToggler.isHidden}`);
    c.images.forEach((i) => console.log(`    image: ${i.src} broken=${i.broken} hasDims=${i.hasDims}`));
    c.fixedOverlaps.forEach((f) => console.log(`    fixed-overlap: ${f.selector}`));
    c.consoleErrors.forEach((e) => console.log(`    console-error: ${e}`));
    c.failedRequests.forEach((f) => console.log(`    failed-request: ${f.url} (${f.error})`));
  }
  console.log(`\n${results.length} page/width/variant combinations checked.`);
  return anyFail;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.base || !args.out) {
    console.error("Usage: node scripts/visual-sweep.js --base <url> --out <dir> [--widths 360,390,1280] [--pages a,b] [--fallback]");
    process.exit(2);
  }
  fs.mkdirSync(args.out, { recursive: true });

  const pwPath = process.env.PLAYWRIGHT_CORE || "/home/tfp/selge-captest/pw/node_modules/playwright-core";
  const chromePath = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/ms-playwright/chromium-1228/chrome-linux64/chrome");
  const { chromium } = require(pwPath);

  const pages = args.pages || (await getPages(args.base));
  const browser = await chromium.launch({ executablePath: chromePath, args: ["--no-sandbox"] });

  const variants = args.fallback ? ["normal", "fallback"] : ["normal"];
  const results = [];
  for (const width of args.widths) {
    for (const variant of variants) {
      const ctx = await browser.newContext(deviceConfig(width));
      if (variant === "fallback") await ctx.route(/\.woff2$/, (r) => r.abort("blockedbyclient"));
      for (const pagePath of pages) results.push(await capturePage(ctx, args.base, pagePath, width, variant, args.out));
      await ctx.close();
    }
  }
  await browser.close();

  process.exitCode = report(results, args.out) ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
