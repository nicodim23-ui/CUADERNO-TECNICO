#!/usr/bin/env python3
"""Arma la vista previa (datos de ejemplo, sin Firebase) a partir de index.html y app.js.
Uso: python3 preview/build.py <carpeta de salida>"""
import re, sys, shutil, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); (out / 'stub').mkdir(parents=True, exist_ok=True)
h = (root / 'index.html').read_text()
style = re.search(r'<style>(.*?)</style>', h, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', h, re.S).group(1)
# El modo oscuro tiene que seguir también el tema elegido en Claude.
m = re.search(r'@media \(prefers-color-scheme:dark\)\{:root\{(.*?)\}\}', style, re.S)
dark = m.group(1)
style = style.replace(m.group(0), '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){%s}}\n:root[data-theme="dark"]{%s}' % (dark, dark))
style += '\n.pv-note{background:var(--amber-soft);color:var(--amber);font-size:13px;font-weight:600;text-align:center;padding-block:7px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}\n'
body = re.sub(r'<script type="module" src="app\.js[^"]*"></script>', '', body)
body = body.replace('<div id="app" hidden>', '<div id="app" hidden><div class="pv-note">Vista previa con datos de ejemplo. Lo que cargues acá no se guarda ni llega a la app real.</div>', 1)
G = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-'
imap = '{"imports":{"%sapp.js":"./stub/app.js","%sauth.js":"./stub/auth.js","%sfirestore.js":"./stub/fs.js"}}' % (G, G, G)
page = ('<title>Vista Previa del Cuaderno</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap">\n'
        '<style>' + style + '</style>\n' + body +
        '\n<script type="importmap">' + imap + '</script>\n<script>' + (root / 'preview/seed.js').read_text() + '</script>\n<script type="module" src="app.js"></script>\n')
(out / 'vista-previa.html').write_text(page)
for f in ['guide.js', 'library.js', 'logo.png']: shutil.copy(root / f, out / f)
(out / 'app.js').write_text(re.sub(r'\.js\?v=\d+', '.js', (root / 'app.js').read_text()))
shutil.copy(root / 'preview/config.js', out / 'config.js')
for f in ['app.js', 'auth.js', 'fs.js']: shutil.copy(root / 'preview/stub' / f, out / 'stub' / f)
print('ok', len(page))
