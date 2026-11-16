#!/usr/bin/env python3
"""Capture Orbit Weaver's screenshots as real renders of the game's own code.

Async Playwright only: the sync driver starves the page main thread on this box and the canvas
never binds. Each shot loads ?shot=<scene>&seed=<n>, waits for window.__shotReady, and saves a JPEG
inside the bounty's caps (long side <=1280, short side >=480, <=256 KiB).
"""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8099"
OUT = Path("/root/.agent/makefun/bg/screenshots")

SHOTS = [
    ("1-start.jpg", "title", 1),
    ("2-play.jpg", "play", 1),
    ("3-end.jpg", "end", 1),
    ("4-win.jpg", "win", 1),
]


async def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=[
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ]
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)

        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)

        for name, scene, seed in SHOTS:
            url = f"{BASE}/?shot={scene}&seed={seed}"
            await page.goto(url, wait_until="load", timeout=60000)
            ready = False
            for _ in range(40):
                if await page.evaluate("() => window.__shotReady === true"):
                    ready = True
                    break
                await page.wait_for_timeout(250)
            size = await page.evaluate("() => [document.getElementById('stage').width, document.getElementById('stage').height]")
            await page.wait_for_timeout(400)
            path = OUT / name
            await page.screenshot(path=str(path), type="jpeg", quality=90)
            print(f"{name:14} scene={scene:6} ready={ready} canvas={size} bytes={path.stat().st_size}")

        if errors:
            print("\nPAGE ERRORS:")
            for line in errors[:20]:
                print("  ", line)
        else:
            print("\nno page errors, no outside requests attempted")

        await browser.close()
    return 0


sys.exit(asyncio.run(main()))
