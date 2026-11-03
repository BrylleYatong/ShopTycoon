"""Browser regression checks. Run: python3 tests/satisfaction.py (requires Playwright and Chromium)."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.route('https://fonts.googleapis.com/**', lambda route: route.abort())
        page.add_init_script('Math.random = () => 0.5')
        page.goto(url, wait_until='domcontentloaded')
        assert page.locator('#satisfaction').inner_text() == '70/100'
        def seed(score=70, legacy=False):
            state = {'cash':10000, 'history':[], 'market':3}
            if not legacy:
                state['satisfaction'] = score
            page.evaluate('(s) => localStorage.setItem("kevin-cookie-tycoon-v1",JSON.stringify(s))', state)
            page.reload(wait_until='domcontentloaded')
        def play(quantity, price):
            page.locator('#quantity').fill(str(quantity))
            page.locator('#price').fill(str(price))
            page.locator('#advertising').fill('0')
            page.locator('#open').click()
            return page.evaluate('JSON.parse(localStorage.getItem("kevin-cookie-tycoon-v1"))')
        assert page.locator('#variety').input_value() == 'chocolateChip'
        assert page.locator('#variety option:checked').inner_text() == 'Chocolate chip'
        assert page.locator('#variety').evaluate('(el) => getComputedStyle(el).fontFamily') == page.locator('#quantity').evaluate('(el) => getComputedStyle(el).fontFamily')
        for variety, price, unit_cost in [('chocolateChip',1.5,.5),('oatmealRaisin',1.1,.35),('doubleChocolate',2.2,.75),('macadamia',2.8,1)]:
            seed()
            page.select_option('#variety', variety)
            assert float(page.locator('#price').input_value()) == price
            assert page.locator('#ingredient-cost').inner_text() == f'${unit_cost:.2f} each'
            assert page.locator('#cost').inner_text() == f'${80*unit_cost+15:.2f}'
            page.reload(wait_until='domcontentloaded')
            assert page.locator('#variety').input_value() == variety
            state = play(100, price)
            result = state['history'][-1]
            assert result['variety'] == variety and result['unitCost'] == unit_cost
            assert result['expenses'] == 100*unit_cost+5
            assert f'${100*unit_cost:.2f} ingredients' in page.locator('.note').inner_text()
            assert page.locator('#variety option:checked').inner_text() in page.locator('#history').inner_text()
        seed()
        assert page.locator('#variety').input_value() == 'chocolateChip'
        state = play(100, 1.5)
        result = state['history'][-1]
        assert result['demand'] == 85 and result['sold'] == 85
        assert state['cash'] == 10072.5
        assert state['satisfaction'] == 73
        assert result['satisfaction']['priceEffect'] == 0
        assert 'All 85' in page.locator('.satisfaction-report').inner_text()
        assert '73/100 (+3)' in page.locator('.satisfaction-history').inner_text()
        page.reload(wait_until='domcontentloaded')
        assert page.locator('#satisfaction').inner_text() == '73/100'
        assert 'All 85' in page.locator('.satisfaction-report').inner_text()
        seed()
        state = play(500, 1)
        assert state['satisfaction'] == 75  # +2 price, +3 availability
        seed()
        state = play(100, 3)
        assert state['satisfaction'] == 67  # -6 price, +3 availability
        seed()
        state = play(0, 1.5)
        assert state['satisfaction'] == 55
        assert '85 of 85' in page.locator('.satisfaction-report').inner_text()
        seed()
        state = play(84, 1.5)
        assert state['satisfaction'] == 69  # even a small shortage costs at least one point
        seed()
        state = play(0, 100)
        assert state['history'][-1]['demand'] == 0
        assert state['history'][-1]['satisfaction']['inventoryEffect'] == 0
        assert 'No demand' in page.locator('.satisfaction-report').inner_text()
        for score, quantity, price, expected in [(99,500,1,100),(1,0,3,0)]:
            seed(score)
            state = play(quantity, price)
            assert state['satisfaction'] == expected
            assert 'limited to 0–100' in page.locator('.satisfaction-report').inner_text()
        seed(legacy=True)
        assert page.locator('#satisfaction').inner_text() == '70/100'
        state = play(100, 1.5)
        legacy_result = state['history'][0].copy()
        legacy_result.pop('satisfaction')
        state['history'] = [legacy_result]
        state.pop('satisfaction')
        page.evaluate('(s) => localStorage.setItem("kevin-cookie-tycoon-v1",JSON.stringify(s))', state)
        page.reload(wait_until='domcontentloaded')
        assert page.locator('#cash').inner_text() == '$10,072.50'
        assert 'Not tracked' in page.locator('.satisfaction-history').inner_text()
        assert page.locator('#satisfaction').inner_text() == '70/100'
        page.on('dialog', lambda d: d.accept())
        page.locator('#restart').click()
        page.wait_for_function("document.getElementById('cash').textContent === '$100.00'")
        assert page.locator('#satisfaction').inner_text() == '70/100'
        assert page.locator('#variety').input_value() == 'chocolateChip'
        page.locator('#quantity').fill('1000000')
        assert page.locator('#open').is_disabled()
        assert page.evaluate('JSON.parse(localStorage.getItem("kevin-cookie-tycoon-v1")).satisfaction') == 70
        page.set_viewport_size({'width':375,'height':812})
        assert page.locator('#satisfaction').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        browser.close()
        print('PASS: price, inventory, zero demand, bounds, feedback, accounting, persistence, legacy saves, reset, invalid plans, mobile layout; no JS errors')
finally:
    server.shutdown()
    server.server_close()
