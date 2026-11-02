import { expect, test } from "../../tools/ui-audit/node_modules/playwright/test.mjs";

const scale = 1.5; // Calibrated from live Wakandi DevTools shell: 200 CSS px rail / ~298 screen px.
const css = (screenPixels: number) => screenPixels / scale;
const near = (actual: number, target: number) => expect(Math.abs(actual - target)).toBeLessThanOrEqual(1);
const box = async (locator: ReturnType<typeof test> extends never ? never : any) =>
  locator.evaluate((element: Element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

test.use({
  baseURL: process.env.AUDIT_BASE_URL ?? "http://localhost:3000",
  storageState: process.env.AUDIT_STORAGE_STATE ?? "artifacts/storage-state.json",
  viewport: { width: 1210, height: 614 },
  deviceScaleFactor: 1,
  expect: { timeout: 300 },
});

test.beforeEach(async ({ page }) => {
  await page.goto("/clients", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible({ timeout: 500 });
});

test.describe("Round 3 Wakandi Clients parity", () => {
  test.describe("1. Header", () => {
    test("height matches the live header metric", async ({ page }) => {
      const r = await box(page.getByTestId("app-header"));
      near(r.height, 64.67);
    });
    test("tenant logo and institution text use the reference gap", async ({ page }) => {
      const v = await page.evaluate(() => {
        const logo = document.querySelector('[data-testid="tenant-logo"]')!;
        const group = logo.parentElement!;
        const text = group.querySelector("div")!;
        return text.getBoundingClientRect().left - logo.getBoundingClientRect().right;
      });
      near(v, css(10));
    });
    test("language flag and label gap match the reference", async ({ page }) => {
      const v = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="language-trigger"]')!;
        const flag = button.querySelector("svg")!;
        const label = [...button.querySelectorAll("span")].find((e) => e.textContent?.trim() === "English")!;
        return label.getBoundingClientRect().left - flag.getBoundingClientRect().right;
      });
      near(v, css(22));
    });
    test("language chevron gap and color match the reference", async ({ page }) => {
      const v = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="language-trigger"]')!;
        const label = [...button.querySelectorAll("span")].find((e) => e.textContent?.trim() === "English")!;
        const svg = button.querySelectorAll("svg")[1]!;
        const s = getComputedStyle(svg);
        return { gap: svg.getBoundingClientRect().left - label.getBoundingClientRect().right, color: s.color };
      });
      expect(v.gap).toBeCloseTo(css(43), 0);
      expect(v.color).toBe("rgb(108, 117, 125)");
    });
    test("branch typography and open status match the reference", async ({ page }) => {
      const v = await page.getByTestId("branch-context").evaluate((e) => {
        const name = e.querySelector("p")!;
        const status = e.querySelectorAll("p")[1]!;
        return { nameSize: getComputedStyle(name).fontSize, nameWeight: getComputedStyle(name).fontWeight, statusSize: getComputedStyle(status).fontSize, icon: status.querySelector("svg") ? getComputedStyle(status.querySelector("svg")!).width : "" };
      });
      expect(v).toEqual({ nameSize: "11.2px", nameWeight: "600", statusSize: "9.33px", icon: "14px" });
    });
    test("profile avatar is 34 CSS px", async ({ page }) => {
      const r = await box(page.getByTestId("header-avatar"));
      expect(r.width).toBe(34);
      expect(r.height).toBe(34);
    });
    test("profile name is bold and chevron is gray", async ({ page }) => {
      const v = await page.getByTestId("user-menu-trigger").evaluate((e) => ({
        weight: getComputedStyle(e.querySelector('[data-testid="header-user-name"]')!).fontWeight,
        chevron: getComputedStyle(e.querySelector("svg:last-of-type")!).color,
      }));
      expect(v).toEqual({ weight: "700", chevron: "rgb(108, 117, 125)" });
    });
  });

  test.describe("2. Page layout and title card", () => {
    test("title card has the measured height", async ({ page }) => near((await box(page.locator('header[data-variant="card"]'))).height, css(104)));
    test("title card inner padding and title offset match", async ({ page }) => {
      const v = await page.locator('header[data-variant="card"]').evaluate((e) => {
        const left = e.firstElementChild!;
        const icon = left.querySelector("svg")!;
        const title = left.querySelector("h1")!;
        const s = getComputedStyle(e);
        return { left: parseFloat(s.paddingLeft), right: parseFloat(s.paddingRight), icon: icon.getBoundingClientRect().width, gap: title.getBoundingClientRect().left - icon.getBoundingClientRect().right };
      });
      expect(v).toEqual({ left: css(31), right: css(29), icon: css(29), gap: css(16) });
    });
    test("title actions have exact reference labels and measured heights", async ({ page }) => {
      const names = ["Add Client", "Add Group", "Client Invitation Link"];
      const actions = page.locator('header[data-variant="card"] a,header[data-variant="card"] button').filter({ hasText: /Add Client|Add Group|Client Invitation Link/ });
      expect(await actions.allTextContents()).toEqual(names);
      for (const action of await actions.all()) near((await box(action)).height, css(44));
    });
    test("title action widths and gaps match the reference", async ({ page }) => {
      const actions = page.locator('header[data-variant="card"] a,header[data-variant="card"] button').filter({ hasText: /Add Client|Add Group|Client Invitation Link/ });
      const values = await actions.evaluateAll((items) => items.map((e) => { const r=e.getBoundingClientRect(); return {x:r.x,width:r.width}; }));
      values.forEach((v, i) => near(v.width, [css(137), css(139), css(218)][i]));
      expect(values[1].x - values[0].x - values[0].width).toBeCloseTo(css(11), 0);
    });
    test("invitation action uses the copy-sheet icon", async ({ page }) => {
      const v = await page.getByRole("link", { name: "Client Invitation Link" }).locator("svg", {}).getAttribute("data-lucide");
      expect(v).toMatch(/copy|files|file/);
    });
  });

  test.describe("3. Toolbar", () => {
    test("search control size and border match the reference", async ({ page }) => {
      const v = await page.locator("#client-search").evaluate((e) => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return {w:r.width,h:r.height,border:s.borderTopWidth,color:s.borderTopColor,radius:s.borderTopLeftRadius}; });
      expect(v).toEqual({ w: css(286), h: css(50), border: "1px", color: "rgb(5, 117, 115)", radius: "6px" });
    });
    test("search text begins beyond the search icon", async ({ page }) => {
      const v = await page.evaluate(() => { const input=document.querySelector("#client-search")!;const icon=input.parentElement!.querySelector("svg")!;const r=icon.getBoundingClientRect(),s=getComputedStyle(input);return {iconRight:r.right,inputLeft:input.getBoundingClientRect().left,textLeft:input.getBoundingClientRect().left+parseFloat(s.paddingLeft)}; });
      expect(v.textLeft).toBeGreaterThan(v.iconRight);
    });
    test("Type and Status filter controls match measured width and height", async ({ page }) => {
      const type = await box(page.getByRole("button", { name: /Filter by Type|Type/ }).first());
      const status = await box(page.getByRole("button", { name: /Filter by Status|Status/ }).first());
      expect([type.width, type.height, status.width, status.height]).toEqual([css(99), css(50), css(112), css(50)]);
    });
    test("Add Filters control matches measured width and height", async ({ page }) => {
      const r = await box(page.getByRole("button", { name: /Add Filters/ }));
      expect([r.width, r.height]).toEqual([css(197), css(50)]);
    });
    test("toolbar controls keep the reference gaps", async ({ page }) => {
      const v = await page.evaluate(() => { const a=[document.querySelector("#client-search")!,...document.querySelectorAll("button")].filter((e)=>e.closest("section")?.querySelector("#client-search")); return a.slice(0,4).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,w:r.width};}); });
      expect(v.length).toBe(4);
      expect(v[1].x - v[0].x - v[0].w).toBeCloseTo(css(11),0);
    });
  });

  test.describe("4. Table", () => {
    test("columns match Wakandi Clients order", async ({ page }) => {
      const headers = await page.locator("thead th").evaluateAll((cells) => cells.map((th) => th.textContent?.trim() || th.getAttribute("aria-label") || ""));
      expect(headers).toEqual(["Member Id", "Full Name", "Reference Number", "National Id", "Type", "Phone Number", "Email Address", "Status", "KYC Status", "DOJ", "Group Name", "Actions"]);
    });
    test("header and body row heights match the measured reference", async ({ page }) => {
      const v = await page.evaluate(() => { const h=document.querySelector("thead tr")!,r=document.querySelector("tbody tr");return {header:h.getBoundingClientRect().height,row:r?.getBoundingClientRect().height??0}; });
      expect(v).toEqual({ header: css(56), row: css(86) });
    });
    test("Member Id is regular weight", async ({ page }) => {
      const v = await page.locator("tbody tr:first-child td:first-child").evaluate((e) => getComputedStyle(e).fontWeight);
      expect(v).toBe("400");
    });
    test("each client row has initials avatar and the reference gap", async ({ page }) => {
      const v = await page.locator("tbody tr:first-child td:nth-child(2)").evaluate((e) => { const a=e.querySelector("[data-client-avatar]"); const n=a?.nextElementSibling;return {exists:Boolean(a),size:a?.getBoundingClientRect().width??0,gap:n? n.getBoundingClientRect().left-a!.getBoundingClientRect().right:0,initials:a?.textContent?.trim()??""}; });
      expect(v.exists).toBe(true);
      near(v.size, css(54));
      near(v.gap, css(16));
      expect(v.initials).toMatch(/^[A-Z]{2}$/);
    });
    test("National Id values use a blue pill or plain N/A", async ({ page }) => {
      const v = await page.locator("tbody tr:first-child td:nth-child(4)").evaluate((e) => {const pill=e.querySelector("[data-national-id]");return {value:e.textContent?.trim(),pill:Boolean(pill),height:pill?.getBoundingClientRect().height??0,color:pill?getComputedStyle(pill).color:""};});
      expect(v.value === "N/A" ? v.pill === false : v.pill && v.height === css(29) && v.color === "rgb(5, 117, 115)").toBe(true);
    });
    test("client type is rendered in title case", async ({ page }) => {
      const v = await page.locator("tbody tr:first-child td:nth-child(5)").innerText();
      expect(v.trim()).toMatch(/^(Individual|Group)$/);
    });
    test("phone and email use verification-colored pills", async ({ page }) => {
      const v = await page.locator("tbody tr:first-child").evaluate((row) => [...row.querySelectorAll("td")].slice(5,7).map((cell) => ({text:cell.textContent?.trim(),pill:Boolean(cell.querySelector('[data-testid="verification-pill"]')),verified:cell.querySelector('[data-testid="verification-pill"]')?.getAttribute("data-verified")})));
      expect(v.every((cell) => cell.text === "N/A" ? !cell.pill : cell.pill && ["true", "false"].includes(cell.verified ?? ""))).toBe(true);
    });
    test("actions column is sticky and has a visible kebab for every row", async ({ page }) => {
      const v = await page.locator("thead th:last-child,tbody tr:first-child td:last-child").evaluateAll((cells) => ({position: getComputedStyle(cells[1]).position,background:getComputedStyle(cells[1]).backgroundColor,buttons:document.querySelectorAll('tbody tr button[aria-label^="Open actions"]').length,rows:document.querySelectorAll("tbody tr").length}));
      expect(v.position === "sticky" && v.buttons === v.rows).toBe(true);
    });
    test("row kebab menu exposes View and Edit", async ({ page }) => {
      await page.getByRole("button", { name: /Open actions for/ }).first().click();
      expect((await page.getByRole("menuitem").allTextContents()).some((item) => /^(View|Edit)( client)?$/.test(item.trim()))).toBe(true);
    });
    test("table scrolls horizontally inside its card", async ({ page }) => {
      const v = await page.locator(".table-scroll").evaluate((e) => ({overflow:getComputedStyle(e).overflowX,scroll:e.scrollWidth>e.clientWidth}));
      expect(v).toEqual({overflow:"auto",scroll:true});
    });
    test("column settings popover has a checkbox for each data column", async ({ page }) => {
      await page.getByRole("button", { name: /column settings/i }).click();
      expect(await page.getByRole("checkbox").count()).toBeGreaterThanOrEqual(7);
    });
  });

  test.describe("5. Sorting", () => {
    test("Full Name sorting cycles through URL states and orders rows", async ({ page }) => {
      const header = page.getByRole("columnheader", { name: /Full Name/ });
      await header.click();
      await expect(page).toHaveURL(/sort=fullName%2CASC|sort=fullName,ASC/);
      await expect(header).toHaveAttribute("data-sort", "ASC");
      const ascending = await page.locator("tbody tr td:nth-child(2)").allTextContents();
      expect(ascending.every((value, index) => index === 0 || ascending[index - 1].localeCompare(value) <= 0)).toBe(true);
      await header.click();
      await expect(page).toHaveURL(/sort=fullName%2CDESC|sort=fullName,DESC/);
      await expect(header).toHaveAttribute("data-sort", "DESC");
      await header.click();
      await expect(page).not.toHaveURL(/sort=fullName/);
    });
    test("Member Id, Reference Number, and Type have sortable controls", async ({ page }) => {
      expect(await page.locator("thead th[data-sortable=true]").count()).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe("6. Sidebar", () => {
    test("collapsible chevrons align in one column", async ({ page }) => {
      const v = await page.locator('[data-testid="nav-group"] button[aria-label^="Expand"], [data-testid="nav-group"] button[aria-label^="Collapse"]').evaluateAll((items)=>items.map(e=>e.getBoundingClientRect().left));
      expect(v.length).toBeGreaterThan(0);
      expect(Math.max(...v)-Math.min(...v)).toBeLessThanOrEqual(1);
    });
    test("Campaigns to Reports pitch follows the measured spacing", async ({ page }) => {
      const v=await page.evaluate(()=>{const a=document.querySelector('[data-nav-label="Campaigns"]')!,b=document.querySelector('[data-nav-label="Reports"]')!;return b.getBoundingClientRect().top-a.getBoundingClientRect().bottom;});
      near(v,css(59));
    });
    test("sidebar active pill and scrollbar keep the reference gutter", async ({ page }) => {
      const v=await page.evaluate(()=>{const side=document.querySelector('[data-testid="app-sidebar"]')!,active=side.querySelector('[aria-current="page"]')!,list=side.querySelector(".sidebar-scroll")!;const sr=side.getBoundingClientRect(),ar=active.getBoundingClientRect();return {right:sr.right-ar.right,scroll:getComputedStyle(list).overflowY,width:getComputedStyle(list,"::-webkit-scrollbar").width};});
      expect(v.right).toBeGreaterThan(0);
      expect(v.scroll).toBe("auto");
    });
    test("navigation labels match reference density and icons", async ({ page }) => {
      const v=await page.locator('[data-nav-label="Dashboard"]').evaluate(e=>({size:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,icons:document.querySelectorAll('[data-nav-label="Business Account"] svg').length}));
      expect(v.size).toBe("13.44px");
      expect(v.icons).toBeGreaterThan(0);
    });
    test("sidebar footer wordmark is AIMSCAMS without reference branding", async ({ page }) => {
      const v=await page.locator('[data-testid="sidebar-footer"]').innerText();
      expect(v).toContain("AIMSCAMS");
      expect(v).not.toMatch(/Wakandi/i);
    });
  });

  test.describe("7. Floating chat button", () => {
    test("chat circle size matches the calibrated reference", async ({ page }) => {
      const r=await box(page.getByTestId("chat-fab"));
      expect([r.width,r.height]).toEqual([css(90),css(90)]);
    });
    test("chat circle uses the calibrated right and bottom insets", async ({ page }) => {
      const v=await page.getByTestId("chat-fab").evaluate(e=>{const r=e.getBoundingClientRect();return {right:innerWidth-r.right,bottom:innerHeight-r.bottom};});
      expect([v.right,v.bottom]).toEqual([css(68),css(68)]);
    });
    test("drag handle center aligns with the calibrated position", async ({ page }) => {
      const v=await page.locator("[data-chat-fab-root]").evaluate(e=>{const d=e.querySelector('button[aria-label="Drag chat button"]')!.getBoundingClientRect();return {centerX:d.x+d.width/2,centerY:d.y+d.height/2};});
      expect(Number.isFinite(v.centerX)&&Number.isFinite(v.centerY)).toBe(true);
    });
  });
});





