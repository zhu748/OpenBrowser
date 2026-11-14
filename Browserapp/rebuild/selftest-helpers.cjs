"use strict";
const { setTimeout: delay } = require("node:timers/promises");
async function waitUntil(
  predicate,
  { timeout = 30000, message = "状态未在期限内达到预期" } = {},
) {
  const deadline = Date.now() + timeout;
  do {
    const value = await predicate();
    if (value) return value;
    await delay(100);
  } while (Date.now() < deadline);
  throw Error(message);
}
async function toggleTheme(page) {
  const current=await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button',{name:'本地工作区菜单',exact:true}).click();
  await page.getByText('主题模式',{exact:true}).click();
  await page.getByText(current==='dark'?'浅色模式':'深色模式',{exact:true}).click();
  await page.keyboard.press('Escape');
}
module.exports = { waitUntil, toggleTheme };
