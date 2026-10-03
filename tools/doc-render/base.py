import base64,os
F='/tmp/fonts/node_modules/@fontsource'
def ff(name,pkg,w=400):
    d=open(f'{F}/{pkg}/files/{pkg}-latin-{w}-normal.woff2','rb').read()
    return "@font-face{font-family:'%s';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2')}"%(name,w,base64.b64encode(d).decode())
FONTS=''.join([ff('Elite','special-elite'),ff('Cour','courier-prime',400),ff('Cour','courier-prime',700),ff('Hand','caveat',400),ff('Hand','caveat',700),ff('Pen','reenie-beanie'),ff('Dot','vt323'),ff('Mono','ibm-plex-mono',400),ff('Mono','ibm-plex-mono',700),ff('Sign','homemade-apple')])
SVGDEFS='''<svg width="0" height="0" style="position:absolute"><defs><filter id="rough"><feOffset/></filter><filter id="ink"><feOffset/></filter><filter id="wob"><feOffset/></filter></defs></svg>'''
GRAIN="url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='3'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .55 0'/></filter><rect width='300' height='300' filter='url(%23f)'/></svg>\")"
FIB="url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.012 .02' numOctaves='4' seed='11'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .35 0'/></filter><rect width='600' height='600' filter='url(%23f)'/></svg>\")"
def page(body,w=900,h=1280,bg='#ece8dc',extra_css='',rot=0,edge='#cfc6ae'):
    return f'''<!doctype html><meta charset=utf-8><style>{FONTS}
*{{box-sizing:border-box}}html,body{{margin:0;background:#16222c;}}
.sheet{{position:relative;width:{w}px;height:{h}px;overflow:hidden;background:#16222c}}
.paper{{position:absolute;inset:14px;background:{bg};border-radius:6px;overflow:hidden}}
{extra_css}</style>{SVGDEFS}<div class=sheet><div class=paper>{body}</div></div>'''
SHIELD='<svg viewBox="0 0 24 24" width="62" height="62"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="none" stroke="#1d2a52" stroke-width="1.4"/><path d="M12 7l1.4 2.9 3.1.4-2.3 2.1.6 3.1L12 14l-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z" fill="#1d2a52"/></svg>'
def stamp(txt,x,y,rot=-8,col='#2a3f9a',w=260,fs=26,sub=None,circle=False):
    st=f'position:absolute;left:{x}px;top:{y}px;transform:rotate({rot}deg);color:{col};filter:url(#ink);opacity:.9;z-index:30;text-align:center;font-family:Elite;'
    if circle: return f'<div style="{st}width:{w}px;height:{w}px;border:5px double {col};border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:{fs}px;line-height:1.1;padding:20px">{txt}<small style="font-size:{fs*.55:.0f}px">{sub or ""}</small></div>'
    return f'<div style="{st}border:4px solid {col};padding:6px 14px;font-size:{fs}px;letter-spacing:.06em;width:{w}px">{txt}{("<div style=font-size:%dpx>%s</div>"%(fs*.5,sub)) if sub else ""}</div>'
def hand(txt,x,y,fs=34,col='#1b3a8a',rot=-1.5,w=None,font='Hand'):
    return f'<div style="position:absolute;left:{x}px;top:{y}px;transform:rotate({rot}deg);font-family:{font};font-size:{fs}px;line-height:1.05;color:{col};filter:url(#ink);z-index:20;{("width:%dpx;"%w) if w else ""}white-space:pre-wrap">{txt}</div>'
def sign(txt,x,y,fs=30,col='#1b3a8a',rot=-4):
    return f'<div style="position:absolute;left:{x}px;top:{y}px;transform:rotate({rot}deg);font-family:Sign;font-size:{fs}px;color:{col};filter:url(#ink);z-index:20;white-space:nowrap">{txt}</div>'
def staple(x,y,rot=-20): return ''
def holes(x,ys): return ''
def letterhead(sub='HOMICÍDIOS',right=''):
    return f'<div style="display:flex;align-items:center;gap:18px;padding:46px 64px 14px;border-bottom:3px double #1d2a52">{SHIELD}<div style="font-family:Cour;color:#1d2a52;line-height:1.15"><b style="font-size:34px;letter-spacing:.08em">DHPP</b><div style="font-size:16px;letter-spacing:.22em">{sub}</div><div style="font-size:13px;letter-spacing:.1em">Estado de São Paulo · Brasil</div></div><div style="margin-left:auto;text-align:right;font-family:Cour;font-size:14px;color:#1d2a52;line-height:1.4">{right}</div></div>'
def shot(html,out,w=900,h=1280,scale=1.5,fmt='jpeg',q=84):
    import subprocess
    p=os.path.abspath(out+'.html');open(p,'w').write(html)
    subprocess.run(['node',os.path.join(os.path.dirname(os.path.abspath(__file__)),'render.js'),p,os.path.abspath(out+'.png'),str(w),str(h),str(scale)],check=True,env=dict(os.environ,NODE_PATH='/opt/node22/lib/node_modules'))
    os.remove(p)
