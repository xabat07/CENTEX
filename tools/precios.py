#!/usr/bin/env python3
"""Ronda 1 (exploración): descarga páginas públicas de los dos fondos y guarda lo que devuelven en data/debug/
para ver de dónde se puede sacar el precio diario. Todavía no escribe precios.json."""
import re, sys, urllib.request, urllib.error, pathlib, datetime

OUT = pathlib.Path('data/debug'); OUT.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (compatible; centex-personal-tracker; uso personal, una consulta)'
FUENTES = {
    'vanguard_finect': 'https://www.finect.com/fondos-inversion/IE0031786696-VANGUARD_EMERGING_MARKETS_STOCK_INDEX_IN',
    'vanguard_finanzen_net': 'https://www.finanzen.net/fonds/vanguard-emerging-markets-stock-index-fund-ie0031786696',
    'ishares_finanzen_ch': 'https://www.finanzen.ch/fonds/ishares-developed-world-index-fund-ie-s-ie000zyrh0q7',
    'ishares_blackrock_uk': 'https://www.blackrock.com/uk/individual/products/315973/',
    'ishares_ishares_ch': 'https://www.ishares.com/ch/individual/en/products/243850/ishares-developed-world-index-fund-ie',
}
log = ['Ejecutado: ' + datetime.datetime.utcnow().isoformat() + 'Z']
for nombre, url in FUENTES.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'es,en;q=0.8'})
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read(1_500_000).decode('utf-8', 'replace')
            log.append(f'{nombre}: HTTP {r.status}, {len(body)} caracteres, tipo {r.headers.get("content-type")}')
    except urllib.error.HTTPError as e:
        log.append(f'{nombre}: HTTP {e.code}'); continue
    except Exception as e:
        log.append(f'{nombre}: error {type(e).__name__}: {e}'); continue
    (OUT / f'{nombre}.html').write_text(body, encoding='utf-8')
    # pistas rápidas: fechas y números con coma/punto cerca de palabras de precio
    pistas = re.findall(r'.{0,60}(?:NAV|Valor liquidativo|Nettoinventarwert|Rücknahme|Kurs|Price|Datos a).{0,100}', re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', body)))[:12]
    for p in pistas: log.append('   · ' + p.strip())
(OUT / 'log.txt').write_text('\n'.join(log) + '\n', encoding='utf-8')
print('\n'.join(log))
