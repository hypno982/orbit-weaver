"""Capture Emberwing screenshots from a real Chrome render of the game.

Drives the game through its own debug handle (window.__emberwing) so every shot
is the game's own code drawing, never a mock-up. No page errors tolerated.
"""
import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "screenshots")
URL = "http://127.0.0.1:8099/index.html"
W, H = 1280, 720


async def settle(page, ms=260):
    await page.wait_for_timeout(ms)


async def shot(page, name):
    path = os.path.join(OUT, name)
    await page.screenshot(path=path, type="jpeg", quality=92, clip={"x": 0, "y": 0, "width": W, "height": H})
    print(f"  {name}  {os.path.getsize(path)} bytes")


async def main():
    os.makedirs(OUT, exist_ok=True)
    errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--force-device-scale-factor=1", "--hide-scrollbars"])
        page = await browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)

        await page.goto(URL, wait_until="load")
        await page.wait_for_function("() => !!window.__emberwing", timeout=10000)
        await settle(page, 700)

        # 1 — title screen.
        await shot(page, "1-title.jpg")

        # 2 — play: mid-depth with a live HUD, embers and hazards on screen.
        await page.evaluate("""() => {
            const g = window.__emberwing;
            g.debug.startRun();
            const s = g.state;
            s.phase = 'play';
            // Give the run some history so the HUD reads as a real game:
            // a chain, a score, embers gathered, some flame spent.
            s.depth = 2;
            s.score = 1840;
            s.chain = 4;
            s.chainTimer = 3.1;
            s.bestChain = 5;
            s.totalEmbers = 17;
            s.gathered = 3;
            s.moth.flame = 58;
            s.moth.x = 520; s.moth.y = 380;
            s.moth.vx = 190; s.moth.vy = -70;
            // Seed embers in readable positions.
            s.embers.length = 0;
            s.embers.push({x: 300, y: 250, vx:0, vy:0, life: 11, spin: 0.4, pulled:false});
            s.embers.push({x: 690, y: 300, vx:0, vy:0, life: 12, spin: 1.9, pulled:false});
            s.embers.push({x: 860, y: 520, vx:0, vy:0, life: 12, spin: 3.1, pulled:false});
            s.embers.push({x: 420, y: 560, vx:0, vy:0, life: 9,  spin: 5.0, pulled:false});
            // Hazards placed where they read as a threat, not on top of the moth.
            s.hazards.length = 0;
            s.hazards.push({x: 250, y: 430, vx: 40, vy: -20, speed: 92, wobble: 0.6, phase: 1.1});
            s.hazards.push({x: 760, y: 200, vx: -30, vy: 30, speed: 92, wobble: 2.2, phase: 2.7});
            s.hazards.push({x: 980, y: 400, vx: 10,  vy: 10, speed: 92, wobble: 4.0, phase: 4.2});
            s.rift.glow = 0.30;
            s.rift.open = false;
        }""")
        await settle(page, 420)
        await shot(page, "2-play.jpg")

        # 3 — a loss screen with a real score behind it.
        await page.evaluate("""() => {
            const g = window.__emberwing;
            const s = g.state;
            s.phase = 'dead';
            s.depth = 4;
            s.score = 6320;
            s.bestChain = 6;
            s.totalEmbers = 51;
            s.moth.flame = 0;
            s.moth.x = 640; s.moth.y = 360;
            s.hazards.length = 3;
            s.hazards.push({x: 700, y: 330, vx: 20, vy: 10, speed: 120, wobble: 1.0, phase: 0.5});
            s.hazards.push({x: 600, y: 400, vx: -10, vy: 15, speed: 120, wobble: 2.4, phase: 3.0});
            s.hazards.push({x: 660, y: 300, vx: 5, vy: -12, speed: 120, wobble: 3.7, phase: 5.1});
        }""")
        await settle(page, 420)
        await shot(page, "3-defeat.jpg")

        # 4 — the win screen, which is the game's ending and its restart.
        await page.evaluate("""() => {
            const g = window.__emberwing;
            const s = g.state;
            s.phase = 'win';
            s.depth = 5;
            s.score = 9480;
            s.bestChain = 7;
            s.totalEmbers = 74;
            s.moth.flame = 42;
            s.gathered = 7;
        }""")
        await settle(page, 420)
        await shot(page, "4-dawn.jpg")

        await browser.close()

    if errors:
        print("PAGE ERRORS:")
        for e in errors:
            print(" ", e)
        sys.exit(1)
    print("no page errors")


asyncio.run(main())
