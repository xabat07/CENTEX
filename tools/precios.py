#!/usr/bin/env python3
"""Guarda el último valor liquidativo (precio diario) de los fondos de Centex en data/precios.json.
Formato: {"ISIN": {"nombre": "...", "moneda": "EUR", "precios": {"AAAA-MM-DD": 12.34, ...}}}
Cada ejecución añade la fecha nueva si la hay; nunca borra ni cambia fechas ya guardadas.
Si una fuente falla o cambia de formato, avisa (la tarea sale en rojo) y no escribe nada raro."""
import json, re, sys, pathlib, urllib.request, datetime

FICHERO = pathlib.Path('data/precios.json')
UA = 'Mozilla/5.0 (compatible; centex-personal-tracker; uso personal)'
MESES = {m: i + 1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}

def bajar(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'es,en;q=0.8'})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read(2_000_000).decode('utf-8', 'replace')
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html))

def ishares():
    # Ficha oficial de iShares: tabla de clases; la fila acaba con el ISIN de la clase S Acc EUR.
    t = bajar('https://www.ishares.com/ch/individual/en/products/243850/ishares-developed-world-index-fund-ie')
    m = re.search(r'([\d.]+) (-?[\d.]+) (-?[\d.]+) (\d{2})/([A-Za-z]{3})/(\d{4}) [\d.]+ [\d.]+ IE000ZYRH0Q7', t)
    if not m: raise ValueError('no encuentro la fila IE000ZYRH0Q7 en la ficha de iShares')
    return float(m.group(1)), datetime.date(int(m.group(6)), MESES[m.group(5)], int(m.group(4))).isoformat()

def vanguard():
    # Ficha de Finect (precio en €, "Datos a dd/mm/aaaa").
    t = bajar('https://www.finect.com/fondos-inversion/IE0031786696-VANGUARD_EMERGING_MARKETS_STOCK_INDEX_IN')
    m = re.search(r'EUR Acc ([\d.]+,\d+) € Datos a (\d{2})/(\d{2})/(\d{4})', t)
    if not m: raise ValueError('no encuentro el precio en la ficha de Finect')
    return float(m.group(1).replace('.', '').replace(',', '.')), f'{m.group(4)}-{m.group(3)}-{m.group(2)}'

FONDOS = [('IE000ZYRH0Q7', 'iShares Developed World Index Fund (IE) S Acc EUR', ishares),
          ('IE0031786696', 'Vanguard Emerging Markets Stock Index Fund EUR Acc', vanguard)]

datos = json.loads(FICHERO.read_text('utf-8')) if FICHERO.exists() else {}
fallos = []
for isin, nombre, fn in FONDOS:
    try:
        precio, fecha = fn()
        hoy = datetime.date.today().isoformat()
        if not (0 < precio < 100000) or fecha > hoy or (datetime.date.fromisoformat(hoy) - datetime.date.fromisoformat(fecha)).days > 10:
            raise ValueError(f'dato raro: {precio} a {fecha}')
        f = datos.setdefault(isin, {'nombre': nombre, 'moneda': 'EUR', 'precios': {}})
        prev = f['precios']
        if prev:
            ult = prev[max(prev)]
            if abs(precio / ult - 1) > 0.15: raise ValueError(f'salto de más del 15 % ({ult} -> {precio}), lo dejo sin guardar')
        if fecha not in prev:
            prev[fecha] = precio; print(f'{isin}: nuevo {fecha} = {precio}')
        else:
            print(f'{isin}: ya estaba {fecha} = {prev[fecha]}')
    except Exception as e:
        fallos.append(f'{isin}: {e}'); print('FALLO', isin, e, file=sys.stderr)

FICHERO.parent.mkdir(exist_ok=True)
FICHERO.write_text(json.dumps(datos, ensure_ascii=False, indent=1, sort_keys=True) + '\n', 'utf-8')
sys.exit(1 if fallos else 0)
