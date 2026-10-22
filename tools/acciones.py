#!/usr/bin/env python3
"""Guarda el precio de cierre de cada día de las acciones de tools/acciones.txt en data/acciones.json.
Formato: {"TICKER": {"nombre": "...", "moneda": "USD", "precios": {"AAAA-MM-DD": 12.34, ...}}}
Cada acción va en su moneda si es euro o dólar; si cotiza en otra (libras, francos suizos…) se pasa a euros con el cambio de ese día.
Se piden los últimos días a Yahoo Finance y se reescriben (el del día en curso puede ser aún provisional); las fechas antiguas no se tocan.
En la lista vale el ticker (TSLA), el ticker con la bolsa delante (BME:NXT) o el ISIN: el código de Yahoo se busca solo
y se guarda en "yahoo" para no tener que buscarlo cada vez. También se puede fijar a mano: "CLAVE = código de Yahoo".
Si una acción falla, avisa (la tarea sale en rojo) y las demás se guardan igual."""
import json, re, sys, pathlib, urllib.request, urllib.parse, datetime

LISTA = pathlib.Path('tools/acciones.txt')
FICHERO = pathlib.Path('data/acciones.json')
UA = 'Mozilla/5.0 (compatible; centex-personal-tracker; uso personal)'
TK = re.compile(r'^[A-Z0-9.\-^=]{1,20}$')
ISIN = re.compile(r'^[A-Z]{2}[A-Z0-9]{9}[0-9]$')
BOLSAS = {'NASDAQ': '', 'NYSE': '', 'AMEX': '', 'NYSEARCA': '', 'BME': '.MC', 'LON': '.L', 'LSE': '.L', 'ETR': '.DE', 'XETRA': '.DE',
          'FRA': '.F', 'EPA': '.PA', 'AMS': '.AS', 'EBR': '.BR', 'BIT': '.MI', 'SWX': '.SW', 'HKEX': '.HK', 'TSE': '.T', 'TSX': '.TO'}
CENTIMOS = {'GBp': 'GBP', 'GBX': 'GBP', 'ZAc': 'ZAR', 'ILA': 'ILS'}   # cotizan en céntimos de esa moneda

def cierres(simbolo):
    url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + urllib.parse.quote(simbolo) + '?range=10d&interval=1d'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            j = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404: raise ValueError('Yahoo Finance no conoce este ticker')
        raise
    res = (j.get('chart') or {}).get('result') or []
    if not res: raise ValueError('Yahoo Finance no conoce este ticker')
    meta, off = res[0]['meta'], res[0]['meta'].get('gmtoffset', 0)
    cl = res[0]['indicators']['quote'][0].get('close') or []
    out = {}
    for t, c in zip(res[0].get('timestamp') or [], cl):
        if c is not None and 0 < c < 1e7:
            out[datetime.datetime.fromtimestamp(t + off, datetime.timezone.utc).date().isoformat()] = c
    if not out: raise ValueError('sin precios recientes')
    return meta.get('currency') or '', meta.get('longName') or meta.get('shortName') or simbolo, out

def buscar(isin):
    url = 'https://query2.finance.yahoo.com/v1/finance/search?q=' + isin + '&quotesCount=5&newsCount=0'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        q = [x['symbol'] for x in json.load(r).get('quotes', []) if x.get('symbol')]
    if not q: raise ValueError('Yahoo Finance no encuentra este ISIN')
    return q[0]

def a_euros(moneda, ps):
    base, f = (CENTIMOS[moneda], 100) if moneda in CENTIMOS else (moneda, 1)
    _, _, cambio = cierres(base + 'EUR=X')
    out = {}
    for d, p in ps.items():
        ds = [x for x in cambio if x <= d] or sorted(cambio)[:1]
        out[d] = p / f * cambio[max(ds)]
    return out

lista = []
for linea in LISTA.read_text('utf-8').splitlines() if LISTA.exists() else []:
    linea = linea.split('#')[0].strip().upper()
    if not linea: continue
    clave, _, simbolo = (x.strip() for x in linea.partition('='))
    if ':' in clave:   # NASDAQ:TSLA, BME:NXT… (la app también quita la bolsa)
        bolsa, clave = clave.split(':', 1)
        simbolo = simbolo or clave + BOLSAS.get(bolsa, '')
    if not simbolo and not ISIN.match(clave): simbolo = clave
    if TK.match(clave) and (not simbolo or TK.match(simbolo)):
        if clave not in [c for c, _ in lista]: lista.append((clave, simbolo))
    else: print('Ignoro la línea', repr(linea), file=sys.stderr)

viejo = json.loads(FICHERO.read_text('utf-8')) if FICHERO.exists() else {}
datos, fallos = {}, []
for clave, simbolo in lista:
    prev = (viejo.get(clave) or {}).get('precios', {})
    try:
        simbolo = simbolo or (viejo.get(clave) or {}).get('yahoo') or buscar(clave)
        moneda, nombre, ps = cierres(simbolo)
        if moneda not in ('EUR', 'USD'):
            ps, moneda = a_euros(moneda, ps), 'EUR'
        nuevos = {**prev, **{d: round(p, 4) for d, p in ps.items()}}
        datos[clave] = {'nombre': nombre, 'moneda': moneda, 'yahoo': simbolo, 'precios': nuevos}
        print(f'{clave} ({simbolo}): {max(ps)} = {nuevos[max(ps)]} {moneda}')
    except Exception as e:
        if clave in viejo: datos[clave] = viejo[clave]
        fallos.append(f'{clave}: {e}'); print('FALLO', clave, simbolo, e, file=sys.stderr)

FICHERO.parent.mkdir(exist_ok=True)
FICHERO.write_text(json.dumps(datos, ensure_ascii=False, indent=1, sort_keys=True) + '\n', 'utf-8')
sys.exit(1 if fallos else 0)
