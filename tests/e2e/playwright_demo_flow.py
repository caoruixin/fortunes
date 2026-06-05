#!/usr/bin/env python3
"""Playwright browser check for the local manhole demo flow."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


WEB_BASE_URL = os.getenv("WEB_BASE_URL", "http://127.0.0.1:3001").rstrip("/")
MACOS_CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")


def launch_browser(playwright):
    try:
        return playwright.chromium.launch(headless=True)
    except Exception as exc:
        if "Executable doesn't exist" not in str(exc) or not MACOS_CHROME.exists():
            raise
        print(f"INFO using system Chrome because Playwright browser is not installed: {MACOS_CHROME}")
        return playwright.chromium.launch(headless=True, executable_path=str(MACOS_CHROME))


def main() -> int:
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        print(
            "FAIL playwright is not available in this Python environment. "
            "Run `python -m pip install -e '.[dev]'` first. "
            f"Original error: {exc}",
            file=sys.stderr,
        )
        return 1

    console_errors: list[str] = []
    page_errors: list[str] = []

    def wait_for_page(page, *, url_pattern: str, text: str, timeout: int = 15000) -> None:
        try:
            page.wait_for_url(url_pattern, wait_until="networkidle", timeout=timeout)
        except PlaywrightTimeoutError:
            pass
        page.get_by_text(text).first.wait_for(timeout=timeout)

    def click_and_wait(page, locator, *, url_pattern: str, text: str, timeout: int = 15000) -> None:
        locator.click()
        wait_for_page(page, url_pattern=url_pattern, text=text, timeout=timeout)

    try:
        with sync_playwright() as playwright:
            browser = launch_browser(playwright)
            page = browser.new_page(viewport={"width": 1440, "height": 1000})
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc: page_errors.append(str(exc)))

            page.goto(f"{WEB_BASE_URL}/dashboard", wait_until="networkidle")
            page.get_by_role("heading", name="管井智能监测管理总览").wait_for()
            click_and_wait(
                page,
                page.get_by_role("link", name=re.compile(r"打开 GIS 态势")).first,
                url_pattern="**/map?focus=mh-0007",
                text="告警筛选",
            )

            page.get_by_role("button", name=re.compile(r"JW-A-0007")).first.click()
            click_and_wait(
                page,
                page.get_by_role("link", name=re.compile(r"进入一井一档")).first,
                url_pattern="**/manholes/mh-0007",
                text="雷达扫描预览",
            )

            click_and_wait(
                page,
                page.get_by_role("link", name=re.compile(r"启动 AI 风险研判")).first,
                url_pattern="**/manholes/mh-0007/diagnosis?autorun=1",
                text="研判进度",
            )

            try:
                page.get_by_role("button", name=re.compile(r"启动 AI 风险研判|重新生成研判结果")).click(timeout=1000)
            except PlaywrightTimeoutError:
                pass
            page.get_by_text("研判结论").wait_for(timeout=8000)
            page.get_by_text("地下病害可视化").wait_for()
            click_and_wait(
                page,
                page.get_by_role("button", name=re.compile(r"生成处置方案")).first,
                url_pattern="**/manholes/mh-0007/plan",
                text="推荐处置组合",
                timeout=20000,
            )

            page.get_by_text("注浆孔位示意").wait_for()
            click_and_wait(
                page,
                page.get_by_role("link", name=re.compile(r"进入施工监管|查看施工监管")).first,
                url_pattern="**/manholes/mh-0007/simulation",
                text="四步处置时间线",
                timeout=20000,
            )

            click_and_wait(
                page,
                page.get_by_role("button", name=re.compile(r"生成验收档案")).first,
                url_pattern="**/manholes/mh-0007/acceptance",
                text="处置前后指标对比",
                timeout=20000,
            )

            click_and_wait(
                page,
                page.get_by_role("link", name=re.compile(r"进入演示脚本")).first,
                url_pattern="**/demo-script",
                text="标准演示路径",
                timeout=20000,
            )

            page.get_by_text("推荐井位").wait_for()
            page.get_by_text("JW-A-0007").first.wait_for()
            browser.close()
    except Exception as exc:
        print(f"FAIL playwright demo flow: {exc}", file=sys.stderr)
        return 1

    if page_errors or console_errors:
        print("FAIL browser errors detected", file=sys.stderr)
        for item in page_errors + console_errors:
            print(f"- {item}", file=sys.stderr)
        return 1

    print("PASS playwright demo flow completed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
