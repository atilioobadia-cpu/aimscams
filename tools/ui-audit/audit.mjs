/**
 * Browser gate for docs/11 and docs/13 §3.
 *
 * Run `node login.mjs` once to create the authenticated storage state, then
 * `node audit.mjs`. Point AUDIT_URL at any authenticated route: shell checks,
 * typography, overflow and console checks run everywhere; dashboard content
 * checks also require the route to end in `/dashboard`.
 *
 * Exit code 1 means the contract was not met.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const target = process.env.AUDIT_URL ?? "http://localhost:3000/dashboard";
const targetUrl = new URL(target);
const topLevelLabels = {
  dashboard: "Dashboard",
  clients: "Client",
  accounts: "Accounts",
  transactions: "Transactions",
  accounting: "Accounting",
  requests: "Requests",
  messages: "Messages",
  campaigns: "Campaigns",
  reports: "Reports",
  import: "Import",
  "business-account": "Business Account",
  settings: "Settings",
};
const settingsChildLabels = {
  "/settings/general": "General",
  "/settings/accounting": "Accounting",
  "/settings/branches": "Branches",
  "/settings/products": "Products",
  "/settings/policies": "Policies",
  "/settings/users": "Users",
  "/settings/roles": "Roles",
  "/settings/services": "Services",
};
const storageState = process.env.AUDIT_STORAGE_STATE
  ? resolve(process.env.AUDIT_STORAGE_STATE)
  : resolve(repoRoot, "artifacts/storage-state.json");
const artifacts = resolve(repoRoot, "artifacts/ui/audit");
const viewports = [
  { width: 1837, height: 1080 },
  { width: 1280, height: 800 },
];

if (!existsSync(storageState)) {
  console.error(`Missing storage state: ${storageState}`);
  console.error(
    "Run `node login.mjs` (or `npm run login` in tools/ui-audit) with AUDIT_EMAIL, AUDIT_PASSWORD and AUDIT_MFA_SECRET.",
  );
  process.exit(2);
}

const checks = [];
const failures = [];

function check(name, pass, detail = {}) {
  const entry = { name, pass: Boolean(pass), detail };
  checks.push(entry);
  if (!pass) failures.push(entry);
}

function equal(name, actual, expected) {
  check(name, JSON.stringify(actual) === JSON.stringify(expected), {
    actual,
    expected,
  });
}

function near(name, actual, expected, tolerance = 1) {
  check(name, Math.abs(actual - expected) <= tolerance, {
    actual,
    expected,
    tolerance,
  });
}

function between(name, actual, min, max) {
  check(name, actual >= min && actual <= max, { actual, min, max });
}

function slugFor(pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-");
  return slug || "root";
}

async function focusedTestId(page) {
  return page.evaluate(() =>
    document.activeElement?.getAttribute("data-testid"),
  );
}

async function waitForHidden(locator, timeout = 3_000) {
  try {
    await locator.waitFor({ state: "hidden", timeout });
    return true;
  } catch {
    return false;
  }
}

async function measureDashboard(page) {
  return page.evaluate(() => {
    const q = (selector, root = document) => root.querySelector(selector);
    const box = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: Number(rect.x.toFixed(2)),
        y: Number(rect.y.toFixed(2)),
        w: Number(rect.width.toFixed(2)),
        h: Number(rect.height.toFixed(2)),
      };
    };
    const styles = (node, names) =>
      node
        ? Object.fromEntries(names.map((name) => [name, getComputedStyle(node)[name]]))
        : null;

    const header = q('[data-testid="app-header"]');
    const logo = q('[data-testid="tenant-logo"]');
    const logoImage = q('[data-testid="tenant-logo"] img');
    const institutionLines = header ? [...header.querySelectorAll("p")] : [];
    const avatar = q('[data-testid="header-avatar"]');
    const flag = q('[data-testid="tanzania-flag"]');
    const branch = q('[data-testid="branch-context"]');
    const language = q('[data-testid="language-trigger"]');
    const user = q('[data-testid="user-menu-trigger"]');

    const sidebar = q('[data-testid="app-sidebar"]');
    const nav = [...document.querySelectorAll('[data-testid="nav-item"]')];
    const footer = q('[data-testid="sidebar-footer"]');
    const toggle = q('[data-testid="sidebar-toggle"]');

    const tabCard = q('[data-testid="dashboard-tab-card"]');
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const kpis = [...document.querySelectorAll('[data-testid="kpi-card"]')];
    const kpiBoxes = kpis.map(box);
    const perRow = kpiBoxes.length
      ? kpiBoxes.filter((item) => Math.abs(item.y - kpiBoxes[0].y) < 0.5).length
      : 0;
    const kpiLabels = kpis.map((card) => q("h3", card)?.textContent?.trim() ?? "");
    const kpiValues = kpis.map((card) => q("p", card)?.textContent?.trim() ?? "");
    const badge = q('[data-testid="kpi-badge"]');
    const badgeIcon = badge ? q("svg", badge) : null;

    const chart = q('[data-testid="funds-chart"]');
    const bars = [...document.querySelectorAll('[data-testid="funds-bar"]')].map(
      (bar) => ({
        ...box(bar),
        bg: getComputedStyle(bar).backgroundColor,
        radius: getComputedStyle(bar).borderRadius,
        series: bar.getAttribute("data-series"),
      }),
    );
    const ticks = [...document.querySelectorAll('[data-testid="funds-axis-tick"]')].map(
      (tick) => ({
        text: tick.textContent?.trim() ?? "",
        size: getComputedStyle(tick).fontSize,
        color: getComputedStyle(tick).color,
      }),
    );
    const gridlines = [...document.querySelectorAll('[data-testid="funds-gridline"]')].map(
      (line) => ({
        top: getComputedStyle(line).borderTopWidth,
        left: getComputedStyle(line).borderLeftWidth,
        color: getComputedStyle(line).borderTopColor,
      }),
    );
    const chartTitle = chart ? q("h2,h3", chart) : null;
    const valueLabels = [...document.querySelectorAll('[data-testid="funds-value-label"]')].map(
      (label) => label.textContent?.trim() ?? "",
    );

    const portfolio = q('[data-testid="portfolio-composition"]');
    const segments = [...document.querySelectorAll('[data-testid="portfolio-segment"]')].map(
      (segment) => ({
        ...box(segment),
        bg: getComputedStyle(segment).backgroundColor,
      }),
    );

    const chat = q('[data-testid="chat-fab"]');
    const banner = q('[data-testid="unposted-banner"]');

    const textViolations = [];
    for (const element of document.querySelectorAll("body *")) {
      if (element instanceof SVGElement) continue;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(element.tagName)) {
        continue;
      }
      if (element.closest('[aria-hidden="true"]')) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        continue;
      }
      const hasOwnText = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0,
      );
      if (!hasOwnText) continue;
      if (style.fontSize !== "12.8px") {
        textViolations.push({
          tag: element.tagName,
          testid: element.getAttribute("data-testid"),
          class: String(element.className).slice(0, 80),
          text: element.textContent?.trim().slice(0, 50),
          fontSize: style.fontSize,
        });
      }
    }

    return {
      url: location.pathname,
      viewport: {
        innerWidth,
        innerHeight,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollY,
      },
      doc: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        bodyBg: getComputedStyle(document.body).backgroundColor,
      },
      header: header
        ? {
            ...box(header),
            position: getComputedStyle(header).position,
            padding: getComputedStyle(header).padding,
            bg: getComputedStyle(header).backgroundColor,
            borderBottomWidth: getComputedStyle(header).borderBottomWidth,
            borderBottomColor: getComputedStyle(header).borderBottomColor,
            boxShadow: getComputedStyle(header).boxShadow,
            text: header.innerText,
          }
        : null,
      logo: logo
        ? {
            ...box(logo),
            radius: getComputedStyle(logo).borderRadius,
            image: logoImage
              ? {
                  ...box(logoImage),
                  naturalWidth: logoImage.naturalWidth,
                  naturalHeight: logoImage.naturalHeight,
                  objectFit: getComputedStyle(logoImage).objectFit,
                  alt: logoImage.getAttribute("alt"),
                }
              : null,
            monogram: !logoImage ? logo.textContent?.trim() ?? "" : null,
          }
        : null,
      institution: institutionLines.length
        ? {
            name: {
              text: institutionLines[0].textContent?.trim() ?? "",
              ...styles(institutionLines[0], ["fontSize", "fontWeight", "color"]),
            },
            detail: {
              text: institutionLines[1]?.textContent?.trim() ?? "",
              ...styles(institutionLines[1], ["fontSize", "fontWeight", "color"]),
            },
          }
        : null,
      avatar: avatar
        ? {
            ...box(avatar),
            radius: getComputedStyle(avatar).borderRadius,
            text: avatar.textContent?.trim() ?? "",
            fontSize: getComputedStyle(avatar).fontSize,
          }
        : null,
      flag: flag ? box(flag) : null,
      branch: branch
        ? { ...box(branch), text: branch.innerText, fontSize: getComputedStyle(branch).fontSize }
        : null,
      language: language
        ? { ...box(language), text: language.innerText, fontSize: getComputedStyle(language).fontSize }
        : null,
      user: user
        ? { ...box(user), text: user.innerText, fontSize: getComputedStyle(user).fontSize }
        : null,
      sidebar: sidebar
        ? {
            ...box(sidebar),
            position: getComputedStyle(sidebar).position,
            bg: getComputedStyle(sidebar).backgroundColor,
            borderRightWidth: getComputedStyle(sidebar).borderRightWidth,
            borderRightColor: getComputedStyle(sidebar).borderRightColor,
          }
        : null,
      nav: nav.map((item) => {
        const icon = q("svg", item);
        const label = q("span", item);
        const parentButton = item.parentElement?.querySelector("button");
        const chevron = q("svg.lucide-chevron-down", item);
        return {
          label: item.getAttribute("data-nav-label"),
          href: item.getAttribute("href"),
          active: item.getAttribute("data-active") === "true",
          ...box(item),
          icon: icon
            ? {
                ...box(icon),
                size: getComputedStyle(icon).width,
              }
            : null,
          labelStyle: label
            ? {
                text: label.textContent?.trim() ?? "",
                ...styles(label, ["fontSize", "fontWeight", "color"]),
              }
            : null,
          color: getComputedStyle(item).color,
          weight: getComputedStyle(item).fontWeight,
          radius: getComputedStyle(item).borderRadius,
          bg: getComputedStyle(item).backgroundColor,
          gap: getComputedStyle(item).columnGap,
          chevron: Boolean(chevron),
          soon: item.textContent?.includes("Soon") ?? false,
          parentChevron: Boolean(parentButton?.querySelector("svg.lucide-chevron-down")),
          parentChevronLabel: parentButton?.getAttribute("aria-label") ?? null,
        };
      }),
      navGroups: [...document.querySelectorAll('[data-testid="nav-group"]')].map((group) => ({
        label: group.getAttribute("data-nav-label"),
        expanded: group.getAttribute("data-expanded"),
        ...box(group),
        bg: getComputedStyle(group).backgroundColor,
      })),
      subitems: [...document.querySelectorAll('[data-testid="nav-subitem"]')].map((item) => {
        const label = q("span", item);
        return {
          label: item.getAttribute("data-nav-label"),
          href: item.getAttribute("href"),
          active: item.getAttribute("data-active") === "true",
          ...box(item),
          bg: getComputedStyle(item).backgroundColor,
          color: getComputedStyle(item).color,
          weight: getComputedStyle(item).fontWeight,
          radius: getComputedStyle(item).borderRadius,
          labelStyle: label
            ? {
                text: label.textContent?.trim() ?? "",
                ...styles(label, ["fontSize", "fontWeight", "color"]),
              }
            : null,
        };
      }),
      footer: footer
        ? {
            ...box(footer),
            padding: getComputedStyle(footer).padding,
            gap: getComputedStyle(footer).rowGap,
            borderTopWidth: getComputedStyle(footer).borderTopWidth,
            borderTopColor: getComputedStyle(footer).borderTopColor,
            text: footer.innerText,
            wordmark: (() => {
              const node = q(".sidebar-footer-wordmark", footer);
              return node
                ? {
                    text: node.textContent?.trim() ?? "",
                    ...styles(node, ["fontSize", "fontWeight", "color"]),
                  }
                : null;
            })(),
            copyright: (() => {
              const node = q(".sidebar-footer-copyright", footer);
              return node
                ? {
                    text: node.innerText,
                    ...styles(node, ["fontSize", "fontWeight", "color"]),
                  }
                : null;
            })(),
          }
        : null,
      toggle: toggle
        ? {
            ...box(toggle),
            radius: getComputedStyle(toggle).borderRadius,
            bg: getComputedStyle(toggle).backgroundColor,
            borderWidth: getComputedStyle(toggle).borderTopWidth,
            ariaExpanded: toggle.getAttribute("aria-expanded"),
            ariaLabel: toggle.getAttribute("aria-label"),
          }
        : null,
      tabCard: tabCard
        ? {
            ...box(tabCard),
            radius: getComputedStyle(tabCard).borderRadius,
            padding: getComputedStyle(tabCard).padding,
            bg: getComputedStyle(tabCard).backgroundColor,
          }
        : null,
      tabs: tabs.map((tab) => {
        const style = getComputedStyle(tab);
        return {
          text: tab.textContent?.trim() ?? "",
          ...box(tab),
          state: tab.getAttribute("data-state"),
          radius: style.borderRadius,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
          bg: style.backgroundColor,
          icons: tab.querySelectorAll("svg").length,
        };
      }),
      kpis: kpis.length
        ? {
            count: kpis.length,
            perRow,
            boxes: kpiBoxes,
            labels: kpiLabels,
            values: kpiValues,
            card: styles(kpis[0], [
              "backgroundColor",
              "borderTopWidth",
              "borderTopColor",
              "borderRadius",
              "padding",
            ]),
            label: styles(q("h3", kpis[0]), ["fontSize", "fontWeight", "color"]),
            value: styles(q("p", kpis[0]), ["fontSize", "fontWeight", "color"]),
            badge: badge
              ? {
                  ...box(badge),
                  radius: getComputedStyle(badge).borderRadius,
                  bg: getComputedStyle(badge).backgroundColor,
                  color: getComputedStyle(badge).color,
                  icon: badgeIcon ? box(badgeIcon) : null,
                }
              : null,
            gapX:
              kpiBoxes.length > 1
                ? Number((kpiBoxes[1].x - (kpiBoxes[0].x + kpiBoxes[0].w)).toFixed(2))
                : null,
            gapY:
              kpiBoxes.length > perRow
                ? Number((kpiBoxes[perRow].y - (kpiBoxes[0].y + kpiBoxes[0].h)).toFixed(2))
                : null,
          }
        : null,
      chart: chart
        ? {
            ...box(chart),
            radius: getComputedStyle(chart).borderRadius,
            padding: getComputedStyle(chart).padding,
            title: chartTitle
              ? {
                  text: chartTitle.innerText,
                  ...styles(chartTitle, ["fontSize", "fontWeight", "color"]),
                }
              : null,
            bars,
            ticks,
            gridlines,
            values: valueLabels,
          }
        : null,
      portfolio: portfolio
        ? {
            ...box(portfolio),
            radius: getComputedStyle(portfolio).borderRadius,
            padding: getComputedStyle(portfolio).padding,
            text: portfolio.innerText,
            segments,
          }
        : null,
      chat: chat
        ? {
            ...box(chat),
            radius: getComputedStyle(chat).borderRadius,
            bg: getComputedStyle(chat).backgroundColor,
            ariaLabel: chat.getAttribute("aria-label"),
          }
        : null,
      banner: banner ? banner.innerText : null,
      fonts: {
        status: document.fonts.status,
        check: document.fonts.check("12.8px Roboto"),
        family: getComputedStyle(document.body).fontFamily,
      },
      textViolations,
    };
  });
}

async function measureCollapsed(page) {
  return page.evaluate(() => {
    const box = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: Number(rect.x.toFixed(2)),
        y: Number(rect.y.toFixed(2)),
        w: Number(rect.width.toFixed(2)),
        h: Number(rect.height.toFixed(2)),
      };
    };
    const items = [...document.querySelectorAll('[data-testid="nav-item"]')];
    return {
      sidebar: box(document.querySelector('[data-testid="app-sidebar"]')),
      toggle: box(document.querySelector('[data-testid="sidebar-toggle"]')),
      footer: box(document.querySelector('[data-testid="sidebar-footer"]')),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      items: items.map((item) => ({
        label: item.getAttribute("data-nav-label"),
        text: item.textContent?.trim() ?? "",
        active: item.getAttribute("data-active") === "true",
        ...box(item),
        icon: box(item.querySelector("svg")),
        bg: getComputedStyle(item).backgroundColor,
        radius: getComputedStyle(item).borderRadius,
      })),
    };
  });
}

await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  target,
  storageState,
  startedAt: new Date().toISOString(),
  viewports: [],
};

for (const viewport of viewports) {
  const label = `${viewport.width}x${viewport.height}`;
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const serverErrors = [];

  console.log(`\n── ${label} ──`);

  const context = await browser.newContext({
    storageState,
    viewport,
    deviceScaleFactor: 1,
    locale: "en-US",
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        location: message.location().url,
      });
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (request.resourceType() === "websocket") return;
    if (/favicon\.ico$/.test(url)) return;
    const failure = request.failure()?.errorText ?? "unknown";
    // Next.js cancels in-flight RSC prefetches when a route changes or the page closes.
    // That abort is expected, not a failed request.
    if (failure === "net::ERR_ABORTED" && /[?&]_rsc=/.test(url)) return;
    failedRequests.push({
      url,
      type: request.resourceType(),
      error: failure,
    });
  });
  page.on("response", (response) => {
    if (response.status() < 500) return;
    if (new URL(response.url()).origin !== targetUrl.origin) return;
    serverErrors.push({ url: response.url(), status: response.status() });
  });

  await page.goto(target, { waitUntil: "networkidle" });
  await page.waitForLoadState("networkidle");

  if (new URL(page.url()).pathname.startsWith("/login")) {
    check(`${label} authenticated`, false, {
      actual: new URL(page.url()).pathname,
      hint: "The storage state was rejected. Re-run login.mjs.",
    });
    await context.close();
    continue;
  }

  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);

  const measured = await measureDashboard(page);
  const isDashboard = measured.url === "/dashboard";

  await page.screenshot({
    path: resolve(artifacts, `${slugFor(measured.url)}-${label}.png`),
  });

  console.log("Shell");
  check(`${label} header is fixed`, measured.header?.position === "fixed");
  near(`${label} header height`, measured.header?.h ?? 0, 68, 0.5);
  near(`${label} header spans layout`, measured.header?.w ?? 0, measured.doc.scrollWidth, 1);
  equal(`${label} header padding`, measured.header?.padding, "0px 14px");
  equal(`${label} header background`, measured.header?.bg, "rgb(255, 255, 255)");
  equal(`${label} header border colour`, measured.header?.borderBottomColor, "rgb(222, 226, 230)");
  between(
    `${label} header border is a hairline`,
    Number.parseFloat(measured.header?.borderBottomWidth ?? "0"),
    0.5,
    1.1,
  );
  check(
    `${label} header has the chrome shadow`,
    /rgb\(195, 198, 202\)/.test(measured.header?.boxShadow ?? ""),
    { actual: measured.header?.boxShadow },
  );

  near(`${label} tenant logo width`, measured.logo?.w ?? 0, 40, 0.8);
  near(`${label} tenant logo height`, measured.logo?.h ?? 0, 40, 0.8);
  near(`${label} tenant logo sits on the header padding`, measured.logo?.x ?? 0, 14, 0.6);
  if (measured.logo?.image) {
    check(`${label} tenant logo image loads`, measured.logo.image.naturalWidth > 0, {
      actual: measured.logo.image,
    });
    check(
      `${label} tenant logo image is contained`,
      measured.logo.image.objectFit === "contain",
      { actual: measured.logo.image.objectFit },
    );
  } else {
    const expectedInitials = (measured.institution?.name?.text ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
    equal(`${label} tenant logo monogram`, measured.logo?.monogram, expectedInitials);
  }
  near(`${label} institution name size`, Number.parseFloat(measured.institution?.name?.fontSize ?? "0"), 12.8, 0.05);
  equal(`${label} institution name weight`, measured.institution?.name?.fontWeight, "600");
  equal(`${label} institution name colour`, measured.institution?.name?.color, "rgb(73, 80, 87)");
  near(`${label} institution detail size`, Number.parseFloat(measured.institution?.detail?.fontSize ?? "0"), 12.8, 0.05);
  equal(`${label} institution detail colour`, measured.institution?.detail?.color, "rgb(108, 117, 125)");

  near(`${label} avatar size`, measured.avatar?.w ?? 0, 34, 0.5);
  near(`${label} avatar height`, measured.avatar?.h ?? 0, 34, 0.5);
  near(`${label} flag width`, measured.flag?.w ?? 0, 24, 0.5);
  near(`${label} flag height`, measured.flag?.h ?? 0, 16, 0.5);
  check(`${label} branch block names a branch`, /Branch/.test(measured.branch?.text ?? ""), {
    actual: measured.branch?.text,
  });
  check(`${label} branch block shows Open`, /Open/.test(measured.branch?.text ?? ""), {
    actual: measured.branch?.text,
  });
  near(`${label} branch block height`, measured.branch?.h ?? 0, 32, 0.8);
  equal(`${label} language label`, measured.language?.text?.trim(), "English");
  near(`${label} user trigger height`, measured.user?.h ?? 0, 46, 1);

  console.log("Sidebar");
  near(`${label} sidebar width`, measured.sidebar?.w ?? 0, 204, 0.5);
  near(`${label} sidebar starts below the header`, measured.sidebar?.y ?? 0, 68, 0.5);
  near(
    `${label} sidebar reaches the viewport bottom`,
    (measured.sidebar?.y ?? 0) + (measured.sidebar?.h ?? 0),
    measured.viewport.innerHeight,
    1,
  );
  equal(`${label} sidebar background`, measured.sidebar?.bg, "rgb(255, 255, 255)");
  equal(`${label} sidebar border colour`, measured.sidebar?.borderRightColor, "rgb(222, 226, 230)");
  between(
    `${label} sidebar border is a hairline`,
    Number.parseFloat(measured.sidebar?.borderRightWidth ?? "0"),
    0.5,
    1.1,
  );

  const expectedNav = [
    "Dashboard",
    "Client",
    "Accounts",
    "Transactions",
    "Accounting",
    "Requests",
    "Messages",
    "Campaigns",
    "Reports",
    "Import",
    "Business Account",
    "Settings",
  ];
  equal(`${label} navigation order`, measured.nav.map((item) => item.label), expectedNav);
  check(
    `${label} every nav destination is a link`,
    measured.nav.every((item) => typeof item.href === "string" && item.href.startsWith("/")),
    { actual: measured.nav.map((item) => ({ label: item.label, href: item.href })) },
  );

  const groupLabels = ["Accounts", "Transactions", "Accounting", "Settings"];
  const standardRows = measured.nav.filter((item) => !groupLabels.includes(item.label));
  const settingsRow = measured.nav.find((item) => item.label === "Settings");
  check(
    `${label} nav rows are 36px`,
    standardRows.every((item) => Math.abs(item.h - 36) <= 0.5),
    { actual: standardRows.map((item) => ({ label: item.label, h: item.h })) },
  );
  near(`${label} Settings group row height`, settingsRow?.h ?? 0, 34, 0.5);
  check(
    `${label} nav icons are 20px on x=28`,
    measured.nav.every(
      (item) => Math.abs(Number.parseFloat(item.icon?.size ?? "0") - 20) <= 0.5 && Math.abs((item.icon?.x ?? 0) - 28) <= 0.6,
    ),
    {
      actual: measured.nav.map((item) => ({
        label: item.label,
        icon: item.icon,
      })),
    },
  );
  check(
    `${label} nav labels are 12.8px`,
    measured.nav.every((item) => item.labelStyle?.fontSize === "12.8px"),
    { actual: measured.nav.map((item) => ({ label: item.label, size: item.labelStyle?.fontSize })) },
  );
  const groupLabelSet = new Set(groupLabels);
  check(
    `${label} nav pitch is 40px`,
    measured.nav
      .slice(1)
      .every((item, index) => {
        const previous = measured.nav[index];
        if (groupLabelSet.has(previous.label)) return true;
        return Math.abs(item.y - previous.y - 40) <= 1.2;
      }),
    {
      actual: measured.nav.slice(1).map((item, index) => ({
        item: item.label,
        pitch: Number((item.y - measured.nav[index].y).toFixed(2)),
      })),
    },
  );

  const segment = targetUrl.pathname.split("/").filter(Boolean)[0] ?? "";
  const expectedTop = segment.startsWith("accounting")
    ? "Accounting"
    : segment.startsWith("account-")
      ? "Accounts"
      : segment.startsWith("transaction-")
        ? "Transactions"
        : segment.startsWith("settings")
        ? "Settings"
        : (topLevelLabels[segment] ?? null);
  const activeTop = measured.nav.find((item) => item.active);
  const activeSub = measured.subitems.find((item) => item.active);
  const inactive =
    measured.nav.find((item) => !item.active && !groupLabels.includes(item.label)) ?? measured.nav[1];

  if (groupLabels.includes(expectedTop ?? "")) {
    const group = measured.navGroups.find((item) => item.label === expectedTop);
    check(`${label} ${expectedTop} group is active`, Boolean(group), { actual: measured.navGroups });
    equal(`${label} ${expectedTop} group is tinted`, group?.bg, "rgb(230, 241, 241)");
    equal(`${label} ${expectedTop} group is expanded`, group?.expanded, "true");
    const expectedChildLabels = { Settings: settingsChildLabels };
    const childLabels = expectedChildLabels[expectedTop] ?? {};
    const expectedChild = childLabels[targetUrl.pathname];
    if (expectedChild) {
      check(`${label} ${expectedTop} child is active`, Boolean(activeSub), {
        actual: measured.subitems.map((item) => ({ label: item.label, active: item.active })),
      });
      if (activeSub) {
        equal(`${label} active ${expectedTop} child`, activeSub.label, expectedChild);
        equal(`${label} active subitem background`, activeSub.bg, "rgb(5, 117, 115)");
        equal(`${label} active subitem text`, activeSub.color, "rgb(255, 255, 255)");
        equal(`${label} active subitem weight`, activeSub.weight, "600");
        equal(`${label} active subitem radius`, activeSub.radius, "6px");
        near(`${label} active subitem height`, activeSub.h, 28, 0.5);
        near(`${label} active subitem width`, activeSub.w, 187.3, 1);
      }
    }
  } else {
    equal(`${label} active nav item`, activeTop?.label, expectedTop);
    if (activeTop) {
      equal(`${label} active pill background`, activeTop.bg, "rgb(5, 117, 115)");
      equal(`${label} active pill text`, activeTop.color, "rgb(255, 255, 255)");
      equal(`${label} active pill weight`, activeTop.weight, "600");
      equal(`${label} active pill radius`, activeTop.radius, "6px");
      near(`${label} active pill height`, activeTop.h, 36, 0.5);
      near(`${label} active pill width`, activeTop.w, 187.3, 1);
    }
  }
  equal(`${label} inactive nav colour`, inactive?.color, "rgb(73, 80, 87)");
  equal(`${label} inactive nav weight`, inactive?.weight, "400");
  equal(`${label} nav radius`, inactive?.radius, "6px");
  equal(`${label} nav icon gap`, inactive?.gap, "8px");

  const chevronItems = ["Reports", "Import"];
  check(
    `${label} chevrons are on the expandable rows`,
    measured.nav
      .filter((item) => chevronItems.includes(item.label))
      .every((item) => item.chevron) &&
      measured.nav
        .filter((item) => !chevronItems.includes(item.label) && item.label !== "Settings")
        .every((item) => !item.chevron),
    { actual: measured.nav.map((item) => ({ label: item.label, chevron: item.chevron })) },
  );
  check(
    `${label} Settings has a group chevron`,
    settingsRow?.parentChevron === true && /Settings/.test(settingsRow?.parentChevronLabel ?? ""),
    { actual: { chevron: settingsRow?.parentChevron, label: settingsRow?.parentChevronLabel } },
  );
  check(`${label} Campaigns is marked Soon`, measured.nav[7].soon === true);
  check(
    `${label} Campaigns still resolves`,
    typeof measured.nav[7].href === "string" && measured.nav[7].href.startsWith("/"),
    { actual: measured.nav[7].href },
  );

  near(`${label} sidebar footer height`, measured.footer?.h ?? 0, 73, 0.5);
  equal(`${label} sidebar footer padding`, measured.footer?.padding, "6px 8px");
  equal(`${label} sidebar footer gap`, measured.footer?.gap, "4px");
  equal(`${label} footer wordmark`, measured.footer?.wordmark?.text, "AIMSCAMS");
  equal(`${label} footer wordmark colour`, measured.footer?.wordmark?.color, "rgb(71, 155, 146)");
  equal(`${label} footer wordmark weight`, measured.footer?.wordmark?.fontWeight, "700");
  near(`${label} footer wordmark size`, Number.parseFloat(measured.footer?.wordmark?.fontSize ?? "0"), 12.8, 0.05);
  check(
    `${label} footer copyright is two lines`,
    /© 2026 AIMSCAMS\./.test(measured.footer?.copyright?.text ?? "") &&
      /All rights reserved\./.test(measured.footer?.copyright?.text ?? ""),
    { actual: measured.footer?.copyright?.text },
  );
  near(`${label} footer copyright size`, Number.parseFloat(measured.footer?.copyright?.fontSize ?? "0"), 12.8, 0.05);

  near(`${label} collapse control size`, measured.toggle?.w ?? 0, 28, 0.5);
  near(`${label} collapse control height`, measured.toggle?.h ?? 0, 28, 0.5);
  near(
    `${label} collapse control straddles the rail`,
    (measured.toggle?.x ?? 0) + (measured.toggle?.w ?? 0) / 2,
    measured.sidebar?.w ?? 0,
    1.5,
  );
  near(
    `${label} collapse control sits above the footer`,
    (measured.footer?.y ?? 0) - ((measured.toggle?.y ?? 0) + (measured.toggle?.h ?? 0)),
    12,
    2,
  );
  equal(`${label} collapse control is expanded`, measured.toggle?.ariaExpanded, "true");

  check(`${label} page background`, measured.doc.bodyBg === "rgb(235, 233, 233)", {
    actual: measured.doc.bodyBg,
  });
  check(
    `${label} no horizontal overflow`,
    measured.doc.scrollWidth <= measured.doc.clientWidth + 1 &&
      measured.doc.bodyScrollWidth <= measured.doc.clientWidth + 1,
    { actual: measured.doc },
  );
  check(
    `${label} Roboto is loaded`,
    measured.fonts.check && /Roboto/.test(measured.fonts.family),
    { actual: measured.fonts },
  );
  equal(`${label} every rendered text is 12.8px`, measured.textViolations, []);

  if (isDashboard) {
    console.log("Dashboard");
    near(`${label} content starts 18px after the sidebar`, measured.tabCard?.x ?? 0, 222, 1);
    near(`${label} content starts 18px below the header`, measured.tabCard?.y ?? 0, 86, 1);
    near(`${label} tab card height`, measured.tabCard?.h ?? 0, 54, 0.5);
    equal(`${label} tab card radius`, measured.tabCard?.radius, "8px");
    equal(`${label} tab card padding`, measured.tabCard?.padding, "0px 14px");
    near(
      `${label} tab card spans the content width`,
      measured.tabCard?.w ?? 0,
      measured.doc.scrollWidth - 204 - 36,
      1,
    );

    equal(
      `${label} tabs`,
      measured.tabs.map((tab) => tab.text),
      ["Overview", "Members", "Loans"],
    );
    check(
      `${label} tabs are 154x44 at radius 6`,
      measured.tabs.every(
        (tab) =>
          Math.abs(tab.w - 154) <= 0.8 &&
          Math.abs(tab.h - 44) <= 0.5 &&
          tab.radius === "6px",
      ),
      { actual: measured.tabs.map(({ text, w, h, radius }) => ({ text, w, h, radius })) },
    );
    check(
      `${label} tab labels are 12.8px and icon-bearing`,
      measured.tabs.every((tab) => tab.fontSize === "12.8px" && tab.icons === 1),
      { actual: measured.tabs.map(({ text, fontSize, icons }) => ({ text, fontSize, icons })) },
    );
    equal(`${label} active tab is Overview`, measured.tabs[0].state, "active");
    equal(`${label} active tab colour`, measured.tabs[0].color, "rgb(255, 255, 255)");
    equal(`${label} active tab background`, measured.tabs[0].bg, "rgb(5, 117, 115)");
    equal(`${label} active tab weight`, measured.tabs[0].fontWeight, "600");
    equal(`${label} inactive tab colour`, measured.tabs[1].color, "rgb(17, 24, 39)");
    equal(`${label} inactive tab weight`, measured.tabs[1].fontWeight, "500");
    equal(
      `${label} tab gap`,
      Number((measured.tabs[1].x - (measured.tabs[0].x + measured.tabs[0].w)).toFixed(2)),
      6,
    );

    equal(`${label} KPI count`, measured.kpis?.count, 8);
    equal(`${label} KPI cards per row`, measured.kpis?.perRow, 4);
    check(
      `${label} KPI cards share a width`,
      (measured.kpis?.boxes ?? []).every(
        (item) => Math.abs(item.w - measured.kpis.boxes[0].w) <= 0.5,
      ),
      { actual: measured.kpis?.boxes?.map((item) => item.w) },
    );
    near(`${label} KPI height`, measured.kpis?.boxes?.[0]?.h ?? 0, 94.8, 1);
    near(`${label} KPI horizontal gap`, measured.kpis?.gapX ?? 0, 12, 0.5);
    near(`${label} KPI vertical gap`, measured.kpis?.gapY ?? 0, 12, 0.5);
    equal(`${label} KPI card background`, measured.kpis?.card?.backgroundColor, "rgb(255, 255, 255)");
    equal(`${label} KPI card border`, measured.kpis?.card?.borderTopColor, "rgb(222, 226, 230)");
    equal(`${label} KPI card radius`, measured.kpis?.card?.borderRadius, "8px");
    equal(`${label} KPI card padding`, measured.kpis?.card?.padding, "14px");
    near(`${label} KPI label size`, Number.parseFloat(measured.kpis?.label?.fontSize ?? "0"), 12.8, 0.05);
    equal(`${label} KPI label weight`, measured.kpis?.label?.fontWeight, "500");
    equal(`${label} KPI label colour`, measured.kpis?.label?.color, "rgb(108, 117, 125)");
    near(`${label} KPI value size`, Number.parseFloat(measured.kpis?.value?.fontSize ?? "0"), 12.8, 0.05);
    equal(`${label} KPI value weight`, measured.kpis?.value?.fontWeight, "700");
    equal(`${label} KPI value colour`, measured.kpis?.value?.color, "rgb(17, 24, 39)");
    near(`${label} KPI badge size`, measured.kpis?.badge?.w ?? 0, 34, 0.5);
    near(`${label} KPI badge height`, measured.kpis?.badge?.h ?? 0, 34, 0.5);
    near(`${label} KPI badge icon`, measured.kpis?.badge?.icon?.w ?? 0, 16, 0.5);
    equal(`${label} KPI labels`, measured.kpis?.labels, [
      "Total Members",
      "Outstanding Loan Principal",
      "Principal in Arrears",
      "Clients in Arrears",
      "Portfolio at Risk",
      "Savings & Shares Balance",
      "Till Status",
      "Unposted Transactions",
    ]);
    check(
      `${label} KPI values are populated`,
      (measured.kpis?.values ?? []).every((value) => value.length > 0),
      { actual: measured.kpis?.values },
    );

    near(`${label} chart radius`, Number.parseFloat(measured.chart?.radius ?? "0"), 8, 0.5);
    equal(`${label} chart padding`, measured.chart?.padding, "30px");
    equal(
      `${label} chart title`,
      (measured.chart?.title?.text ?? "").replace(/\s+/g, "").toLowerCase(),
      "fundsinvsfundsout",
    );
    equal(`${label} chart bars`, measured.chart?.bars?.length, 2);
    check(
      `${label} chart bars are 77px and square`,
      (measured.chart?.bars ?? []).every(
        (bar) => Math.abs(bar.w - 77) <= 1 && Number.parseFloat(bar.radius) === 0,
      ),
      { actual: measured.chart?.bars?.map(({ w, radius }) => ({ w, radius })) },
    );
    equal(`${label} funds-in bar colour`, measured.chart?.bars?.[0]?.bg, "rgb(5, 117, 115)");
    equal(`${label} funds-out bar colour`, measured.chart?.bars?.[1]?.bg, "rgb(199, 90, 67)");
    equal(`${label} chart axis steps`, measured.chart?.ticks?.length, 8);
    check(
      `${label} chart axis text`,
      (measured.chart?.ticks ?? []).every(
        (tick, index) => tick.text === `TZS ${50 - index * 5}M`,
      ),
      { actual: measured.chart?.ticks?.map((tick) => tick.text) },
    );
    check(
      `${label} chart axis type`,
      (measured.chart?.ticks ?? []).every(
        (tick) => tick.size === "12.8px" && tick.color === "rgb(102, 102, 102)",
      ),
      { actual: measured.chart?.ticks },
    );
    check(
      `${label} horizontal-only gridlines`,
      (measured.chart?.gridlines ?? []).length === 8 &&
        measured.chart.gridlines.every(
          (line) => Number.parseFloat(line.top) > 0 && Number.parseFloat(line.left) === 0,
        ),
      { actual: measured.chart?.gridlines },
    );
    equal(`${label} chart value labels`, measured.chart?.values?.length, 2);

    equal(`${label} portfolio segments`, measured.portfolio?.segments?.length, 4);
    check(
      `${label} portfolio segments form one bar`,
      (measured.portfolio?.segments ?? []).every(
        (segment) => Math.abs(segment.h - 20) <= 0.5 && segment.w > 0,
      ),
      { actual: measured.portfolio?.segments?.map(({ w, h }) => ({ w, h })) },
    );
    check(
      `${label} portfolio totals`,
      /Total portfolio/.test(measured.portfolio?.text ?? "") &&
        /TZS/.test(measured.portfolio?.text ?? ""),
      { actual: measured.portfolio?.text?.slice(0, 120) },
    );

    if (viewport.width >= 1600) {
      near(`${label} chart and portfolio share a row`, measured.portfolio?.y ?? 0, measured.chart?.y ?? 0, 1);
      near(
        `${label} chart and portfolio gap`,
        (measured.portfolio?.x ?? 0) - ((measured.chart?.x ?? 0) + (measured.chart?.w ?? 0)),
        20,
        1,
      );
    } else {
      near(
        `${label} portfolio stacks below the chart`,
        measured.portfolio?.y ?? 0,
        (measured.chart?.y ?? 0) + (measured.chart?.h ?? 0) + 20,
        1,
      );
      near(`${label} stacked portfolio aligns left`, measured.portfolio?.x ?? 0, measured.chart?.x ?? 0, 1);
    }

    const bannerCount = Number.parseInt(
      /^(\d+)\s+transactions?/.exec(measured.banner ?? "")?.[1] ?? "-1",
      10,
    );
    check(
      `${label} banner reconciles with the unposted KPI`,
      bannerCount > 0 && measured.kpis?.values?.[7] === String(bannerCount),
      { actual: { bannerCount, kpi: measured.kpis?.values?.[7], banner: measured.banner } },
    );
  }

  near(`${label} chat size`, measured.chat?.w ?? 0, 60, 0.5);
  near(`${label} chat height`, measured.chat?.h ?? 0, 60, 0.5);
  equal(`${label} chat colour`, measured.chat?.bg, "rgb(3, 118, 116)");
  near(
    `${label} chat right inset`,
    measured.doc.scrollWidth - ((measured.chat?.x ?? 0) + (measured.chat?.w ?? 0)),
    20,
    1.5,
  );
  near(
    `${label} chat bottom inset`,
    measured.viewport.innerHeight - ((measured.chat?.y ?? 0) + (measured.chat?.h ?? 0)),
    16,
    1,
  );

  console.log("Interactions");
  await page.getByTestId("language-trigger").click();
  const languageMenu = page.getByRole("menu").last();
  check(`${label} language menu opens`, await languageMenu.isVisible(), {});
  const languageItems = await languageMenu.getByRole("menuitemradio").allTextContents();
  check(
    `${label} language menu lists both languages`,
    languageItems.includes("English") && languageItems.includes("Kiswahili"),
    { actual: languageItems },
  );
  await page.keyboard.press("Escape");
  check(`${label} language menu closes on Escape`, await waitForHidden(languageMenu), {});
  await page.waitForTimeout(120);
  equal(`${label} language focus returns`, await focusedTestId(page), "language-trigger");

  await page.getByTestId("user-menu-trigger").click();
  const userMenu = page.getByRole("menu").last();
  check(`${label} user menu opens`, await userMenu.isVisible(), {});
  const userItems = await userMenu.getByRole("menuitem").allTextContents();
  check(`${label} user menu has Sign out`, userItems.some((item) => /Sign out/.test(item)), {
    actual: userItems,
  });
  await page.keyboard.press("Escape");
  check(`${label} user menu closes on Escape`, await waitForHidden(userMenu), {});
  await page.waitForTimeout(120);
  equal(`${label} user focus returns`, await focusedTestId(page), "user-menu-trigger");

  if (isDashboard) {
    await page.getByTestId("unposted-review").click();
    const sheet = page.getByTestId("unposted-sheet");
    check(`${label} review sheet opens`, await sheet.isVisible(), {});
    const sheetBox = await sheet.boundingBox();
    near(`${label} review sheet width`, sheetBox?.width ?? 0, 448, 1);
    const sheetRows = await sheet.locator("tbody tr").count();
    const bannerCount = Number.parseInt(
      /^(\d+)\s+transactions?/.exec(measured.banner ?? "")?.[1] ?? "-1",
      10,
    );
    equal(`${label} review sheet rows reconcile`, sheetRows, bannerCount);
    const sheetOverflow = await sheet.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    check(
      `${label} review sheet has no horizontal overflow`,
      sheetOverflow.scrollWidth <= sheetOverflow.clientWidth + 1,
      { actual: sheetOverflow },
    );
    await page.keyboard.press("Escape");
    check(`${label} review sheet closes on Escape`, await waitForHidden(sheet), {});
    await page.waitForTimeout(150);
    equal(`${label} review focus returns`, await focusedTestId(page), "unposted-review");
  }

  await page.getByTestId("chat-fab").click();
  const chatDialog = page.getByRole("dialog");
  check(`${label} chat opens`, await chatDialog.isVisible(), {});
  check(
    `${label} chat title`,
    /Support chat/i.test((await chatDialog.getByRole("heading").first().textContent()) ?? ""),
    { actual: await chatDialog.getByRole("heading").first().textContent().catch(() => null) },
  );
  const chatBox = await chatDialog.boundingBox();
  check(
    `${label} chat stays in the viewport`,
    chatBox !== null &&
      chatBox.x >= 0 &&
      chatBox.y >= 0 &&
      chatBox.x + chatBox.width <= viewport.width &&
      chatBox.y + chatBox.height <= viewport.height,
    { actual: chatBox },
  );
  await page.keyboard.press("Escape");
  check(`${label} chat closes on Escape`, await waitForHidden(chatDialog), {});
  await page.waitForTimeout(180);
  equal(`${label} chat focus returns to the FAB`, await focusedTestId(page), "chat-fab");

  if (isDashboard) {
    await page.getByTestId("dashboard-tab-members").click();
    await page.waitForTimeout(250);
    equal(
      `${label} Members tab activates`,
      await page.getByTestId("dashboard-tab-members").getAttribute("data-state"),
      "active",
    );
    check(
      `${label} Members tab shows its empty state`,
      await page.getByRole("heading", { name: /Member analytics/i }).isVisible(),
      {},
    );
    check(
      `${label} Members tab hides the KPI grid`,
      !(await page.getByTestId("kpi-card").first().isVisible()),
      {},
    );

    await page.getByTestId("dashboard-tab-loans").click();
    await page.waitForTimeout(250);
    check(
      `${label} Loans tab shows its empty state`,
      await page.getByRole("heading", { name: /Loan analytics/i }).isVisible(),
      {},
    );

    await page.getByTestId("dashboard-tab-overview").click();
    await page.waitForTimeout(250);
    check(
      `${label} Overview tab restores the KPI grid`,
      await page.getByTestId("kpi-card").first().isVisible(),
      {},
    );

    const firstBar = page.getByTestId("funds-bar").first();
    await firstBar.hover();
    await page.waitForTimeout(250);
    const tooltip = page.getByRole("tooltip");
    check(`${label} chart tooltip opens on hover`, await tooltip.isVisible(), {});
    check(
      `${label} chart tooltip names the series`,
      /Funds in: TZS/.test((await tooltip.textContent()) ?? ""),
      { actual: await tooltip.textContent().catch(() => null) },
    );
    await page.mouse.move(8, 300);
    await page.waitForTimeout(200);
    await firstBar.focus();
    await page.waitForTimeout(250);
    check(`${label} chart tooltip opens on focus`, await tooltip.isVisible(), {});
    await page.getByTestId("dashboard-tab-overview").focus();
    await page.waitForTimeout(200);
    check(`${label} chart tooltip closes on blur`, !(await tooltip.isVisible().catch(() => false)), {});
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId("sidebar-toggle").click();
  await page.waitForTimeout(400);
  const collapsed = await measureCollapsed(page);
  near(`${label} collapsed sidebar width`, collapsed.sidebar?.w ?? 0, 76, 0.5);
  check(
    `${label} collapsed labels are removed`,
    collapsed.items.every((item) => item.text === "" || item.label === "Campaigns"),
    { actual: collapsed.items.map((item) => ({ label: item.label, text: item.text })) },
  );
  check(
    `${label} collapsed icons stay on x=28`,
    collapsed.items.every(
      (item) => item.icon && Math.abs(item.icon.x - 28) <= 0.6 && Math.abs(item.icon.w - 20) <= 0.5,
    ),
    { actual: collapsed.items.map((item) => ({ label: item.label, icon: item.icon })) },
  );
  const collapsedActive = collapsed.items.find((item) => item.active);
  equal(
    `${label} collapsed active pill stays teal`,
    collapsedActive?.bg,
    "rgb(5, 117, 115)",
  );
  near(
    `${label} collapsed toggle follows the rail`,
    (collapsed.toggle?.x ?? 0) + (collapsed.toggle?.w ?? 0) / 2,
    collapsed.sidebar?.w ?? 0,
    1.5,
  );
  check(
    `${label} collapsed page has no horizontal overflow`,
    collapsed.scrollWidth <= collapsed.clientWidth + 1,
    { actual: { scrollWidth: collapsed.scrollWidth, clientWidth: collapsed.clientWidth } },
  );
  await page.screenshot({
    path: resolve(artifacts, `${slugFor(measured.url)}-${label}-collapsed.png`),
  });

  await page.getByTestId("nav-item").first().hover();
  await page.waitForTimeout(900);
  const collapsedTooltip = page.getByRole("tooltip");
  check(`${label} collapsed nav shows a tooltip`, await collapsedTooltip.isVisible(), {});
  equal(`${label} collapsed tooltip label`, (await collapsedTooltip.textContent())?.trim(), "Dashboard");

  await page.getByTestId("sidebar-toggle").click();
  await page.waitForTimeout(400);
  near(
    `${label} sidebar expands again`,
    (await page.getByTestId("app-sidebar").boundingBox())?.width ?? 0,
    204,
    0.5,
  );
  equal(
    `${label} collapse control reports expanded`,
    await page.getByTestId("sidebar-toggle").getAttribute("aria-expanded"),
    "true",
  );

  equal(`${label} console errors`, consoleMessages.filter((message) => message.type === "error"), []);
  equal(`${label} console warnings`, consoleMessages.filter((message) => message.type === "warning"), []);
  equal(`${label} unhandled page errors`, pageErrors, []);
  equal(`${label} failed same-origin requests`, failedRequests.filter((request) => new URL(request.url).origin === targetUrl.origin), []);
  equal(`${label} HTTP 5xx responses`, serverErrors, []);

  report.viewports.push({
    viewport,
    measured,
    interactions: {
      collapsed,
      consoleMessages,
      pageErrors,
      failedRequests,
      serverErrors,
    },
  });

  await context.close();
}

await browser.close();

report.finishedAt = new Date().toISOString();
report.checks = checks;
report.failures = failures;
await writeFile(resolve(artifacts, "report.json"), JSON.stringify(report, null, 2));

console.log(`\n${checks.length - failures.length}/${checks.length} checks passed.`);
if (failures.length > 0) {
  console.log(`\n${failures.length} failed:`);
  for (const failure of failures) {
    console.log(`- ${failure.name}`);
    if (Object.keys(failure.detail).length > 0) {
      console.log(`  ${JSON.stringify(failure.detail)}`);
    }
  }
  process.exit(1);
}
console.log(`Report: ${resolve(artifacts, "report.json")}`);
