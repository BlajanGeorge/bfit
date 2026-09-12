#!/usr/bin/env python3
"""Install a SpriteCook output into the app.

  anim-install.py anim  <exercise-id> <url-or-file> [--asset ID]   # animated webp -> assets/animations/<id>.webp
  anim-install.py thumb <exercise-id> <url-or-file> [--asset ID]   # transparent png -> assets/exercise-thumbs/<id>.png
  anim-install.py headroom <exercise-id> [--top 0.42]              # thumb -> Downloads/<id>-headroom.png (animation reference)

Animations are cropped to the union bounding box of all frames; a 4x4 contact
sheet is written next to the scratch dir for review. Both commands register the
asset in src/data/catalog.ts and record the SpriteCook asset id in
spritecook-assets.json when --asset is given.
"""
import argparse, hashlib, io, json, os, re, subprocess, sys
from PIL import Image, ImageSequence
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, 'src', 'data', 'catalog.ts')
MANIFEST = os.path.join(ROOT, 'spritecook-assets.json')
SHEET_DIR = os.environ.get('ANIM_SHEET_DIR', os.path.expanduser('~/Downloads'))


def bbox(im, thr=128):
    return im.getchannel('A').point(lambda v: 255 if v >= thr else 0).getbbox()


def load(src):
    if re.match(r'^https?://', src):
        data = subprocess.run(['curl', '-fsSL', src], check=True, capture_output=True).stdout
        return io.BytesIO(data)
    return open(src, 'rb')


def register(kind, ex_id):
    s = open(CATALOG).read()
    if kind == 'anim':
        marker, line = 'EXERCISE_ANIMATIONS', f"  '{ex_id}': require('@/assets/animations/{ex_id}.webp'),\n"
    else:
        marker, line = 'EXERCISE_THUMBS', f"  '{ex_id}': require('@/assets/exercise-thumbs/{ex_id}.png'),\n"
    if line in s:
        return
    start = s.index(marker)
    end = s.index('\n}', start)
    s = s[:end + 1] + line + s[end + 1:]
    open(CATALOG, 'w').write(s)


def manifest(ex_id, kind, asset_id, path):
    m = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    sha12 = hashlib.sha256(open(path, 'rb').read()).hexdigest()[:12]
    m.setdefault(ex_id, {})[kind] = {'asset_id': asset_id, 'sha12': sha12}
    json.dump(m, open(MANIFEST, 'w'), indent=2, sort_keys=True)


WEBPMUX = os.environ.get('WEBPMUX', 'webpmux')


def frame_durations(src):
    """Per-frame durations (ms) via webpmux -info; falls back to None (use global)."""
    if re.match(r'^https?://', src):
        return None
    try:
        out = subprocess.run([WEBPMUX, '-info', src], check=True, capture_output=True, text=True).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    durs = []
    for line in out.splitlines():
        m = re.match(r'^\s*(\d+):', line)
        if m:
            parts = line.split()
            # width height alpha x y DUR dispose blend size compression
            durs.append(int(parts[6]))
    return durs or None


def cmd_anim(a):
    im = Image.open(load(a.src))
    frames = [f.convert('RGBA').copy() for f in ImageSequence.Iterator(im)]
    im_dur = im.info.get('duration', 125)
    durs = frame_durations(a.src)
    if not durs or len(durs) != len(frames):
        durs = [im_dur] * len(frames)
    dur = durs if len(set(durs)) > 1 else im_dur
    alpha = frames[0].getchannel('A')
    transparent = float((np.array(alpha) < 128).mean())
    if transparent < 0.3:
        sys.exit(f'REFUSED: only {transparent:.0%} transparent pixels — this animation still has a background')
    union = None
    for f in frames:
        b = bbox(f)
        if b:
            union = b if union is None else (min(union[0], b[0]), min(union[1], b[1]), max(union[2], b[2]), max(union[3], b[3]))
    pad = 8
    l, t, r, b = union
    W, H = frames[0].size
    box = (max(0, l - pad), max(0, t - pad), min(W, r + pad), min(H, b + pad))
    out = [f.crop(box) for f in frames]
    dst = os.path.join(ROOT, 'assets', 'animations', f'{a.id}.webp')
    out[0].save(dst, save_all=True, append_images=out[1:], duration=dur, loop=0, lossless=True, method=6)
    w, h = out[0].size
    tw, th = int(w * 0.6), int(h * 0.6)
    cols = 4
    rows = (len(out) + cols - 1) // cols
    sheet = Image.new('RGBA', (tw * cols + 6 * (cols - 1), th * rows + 6 * (rows - 1)), (20, 22, 30, 255))
    for i, f in enumerate(out):
        tile = f.resize((tw, th))
        sheet.paste(tile, ((i % cols) * (tw + 6), (i // cols) * (th + 6)), tile)
    sheet_path = os.path.join(SHEET_DIR, f'{a.id}-sheet.png')
    sheet.save(sheet_path)
    register('anim', a.id)
    if a.asset:
        manifest(a.id, 'animation', a.asset, dst)
    print(f'anim {a.id}: {len(out)} frames {im.size} -> {out[0].size}, sheet {sheet_path}')


def cmd_thumb(a):
    im = Image.open(load(a.src)).convert('RGBA')
    bb = bbox(im)
    im = im.crop(bb) if bb else im
    dst = os.path.join(ROOT, 'assets', 'exercise-thumbs', f'{a.id}.png')
    im.save(dst)
    register('thumb', a.id)
    if a.asset:
        manifest(a.id, 'start', a.asset, dst)
    print(f'thumb {a.id}: {im.size}')


def cmd_headroom(a):
    src = os.path.join(ROOT, 'assets', 'exercise-thumbs', f'{a.id}.png')
    fig = Image.open(src).convert('RGBA')
    S = 1024
    th = int(S * (1 - a.top - 0.03))
    sc = th / fig.height
    fig = fig.resize((int(fig.width * sc), th), Image.LANCZOS)
    cv = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    cv.paste(fig, ((S - fig.width) // 2, S - fig.height - int(S * 0.03)), fig)
    dst = os.path.expanduser(f'~/Downloads/{a.id}-headroom.png')
    cv.save(dst)
    print(f'headroom {a.id}: {dst}')


p = argparse.ArgumentParser()
sub = p.add_subparsers(dest='cmd', required=True)
s = sub.add_parser('anim'); s.add_argument('id'); s.add_argument('src'); s.add_argument('--asset')
s = sub.add_parser('thumb'); s.add_argument('id'); s.add_argument('src'); s.add_argument('--asset')
s = sub.add_parser('headroom'); s.add_argument('id'); s.add_argument('--top', type=float, default=0.42)
a = p.parse_args()
{'anim': cmd_anim, 'thumb': cmd_thumb, 'headroom': cmd_headroom}[a.cmd](a)
