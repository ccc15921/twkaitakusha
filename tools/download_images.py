#!/usr/bin/env python3
"""把試算表 goods CSV 裡所有企劃封面／周邊縮圖下載備份到 img_backup/。

檔名：<goods project code>_<goods index>.<副檔名>
  例：aziro_commemorativemerch_0.png（index 0 = 企劃封面）

用法（在 twkaitakusha 資料夾內執行，只用 Python 內建模組，不需另外安裝）：
  python tools/download_images.py                 # 從 js/app.js 的 CSV_URL 讀取最新表單
  python tools/download_images.py --csv goods.csv # 改用本機 CSV 檔
  python tools/download_images.py --retry         # 只重試上次失敗的
可以重複執行：已下載過（檔案存在且不是空的）會直接略過。
結果記錄在 img_backup/manifest.csv（含來源網址、檔名、狀態），失敗的會列在最後。
"""
import argparse, csv, io, mimetypes, os, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'img_backup')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
CT_EXT = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
          'image/avif': '.avif', 'image/svg+xml': '.svg'}


def csv_url():
    src = open(os.path.join(ROOT, 'js', 'app.js'), encoding='utf-8').read()
    m = re.search(r"CSV_URL\s*=\s*'([^']+)'", src)
    if not m:
        sys.exit('找不到 js/app.js 裡的 CSV_URL，請改用 --csv 指定本機 CSV。')
    return m.group(1)


def read_rows(path):
    if path:
        text = open(path, encoding='utf-8-sig').read()
    else:
        req = urllib.request.Request(csv_url(), headers={'User-Agent': UA})
        text = urllib.request.urlopen(req, timeout=60).read().decode('utf-8-sig')
    return list(csv.DictReader(io.StringIO(text)))


def safe(s):
    return re.sub(r'[\\/:*?"<>|\s]+', '_', s.strip())


def url_ext(url):
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
    return ext if re.fullmatch(r'\.[a-z0-9]{2,5}', ext) else ''


def quote_url(url):
    p = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((p.scheme, p.netloc,
                                    urllib.parse.quote(p.path, safe="/%:@!$&'()*+,;=-._~"),
                                    urllib.parse.quote(p.query, safe="=&%:@/?+,;-._~"), ''))


def existing(stem):
    for f in os.listdir(OUT):
        if os.path.splitext(f)[0] == stem and os.path.getsize(os.path.join(OUT, f)) > 0:
            return f
    return None


def fetch(job):
    stem, url = job
    done = existing(stem)
    if done:
        return stem, url, done, 'skip'
    last = ''
    for attempt in range(3):
        try:
            req = urllib.request.Request(quote_url(url), headers={
                'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
                'Referer': 'https://shop.hololivepro.com/'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                ct = (r.headers.get('Content-Type') or '').split(';')[0].strip().lower()
            if not data:
                raise ValueError('empty response')
            ext = url_ext(url) or CT_EXT.get(ct) or mimetypes.guess_extension(ct) or '.bin'
            name = stem + ext
            with open(os.path.join(OUT, name + '.part'), 'wb') as f:
                f.write(data)
            os.replace(os.path.join(OUT, name + '.part'), os.path.join(OUT, name))
            return stem, url, name, 'ok'
        except Exception as e:  # noqa: BLE001
            last = f'{type(e).__name__}: {e}'
            time.sleep(1.5 * (attempt + 1))
    return stem, url, '', 'FAIL ' + last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--csv', help='使用本機 CSV 檔，不從網路讀取')
    ap.add_argument('--retry', action='store_true', help='只重試 manifest 中失敗的項目')
    ap.add_argument('--workers', type=int, default=4)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    jobs, seen = [], {}
    for r in read_rows(a.csv):
        code, idx, url = r['goods project code'].strip(), r['goods index'].strip(), r['goods picture'].strip()
        if not code or not url:
            continue
        stem = f'{safe(code)}_{safe(idx or "0")}'
        if stem in seen:
            print('警告：重複的編號', stem, '（略過後面那一筆）')
            continue
        seen[stem] = url
        jobs.append((stem, url))

    if a.retry:
        failed = set()
        mp = os.path.join(OUT, 'manifest.csv')
        if os.path.exists(mp):
            failed = {x['key'] for x in csv.DictReader(open(mp, encoding='utf-8-sig')) if x['status'].startswith('FAIL')}
        jobs = [j for j in jobs if j[0] in failed]

    print(f'共 {len(jobs)} 張，輸出到 {OUT}')
    results = {}
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        for i, res in enumerate(ex.map(fetch, jobs), 1):
            results[res[0]] = res
            if res[3] != 'skip':
                print(f'[{i}/{len(jobs)}] {res[3][:60]:<8} {res[0]}')

    # 合併舊 manifest（--retry 時保留其他項目的紀錄）
    mp = os.path.join(OUT, 'manifest.csv')
    old = {}
    if os.path.exists(mp):
        old = {x['key']: x for x in csv.DictReader(open(mp, encoding='utf-8-sig'))}
    for stem, url in seen.items():
        if stem in results:
            _, u, name, st = results[stem]
            old[stem] = {'key': stem, 'url': u, 'file': name, 'status': 'ok' if st == 'skip' else st}
        elif stem not in old:
            f = existing(stem)
            old[stem] = {'key': stem, 'url': url, 'file': f or '', 'status': 'ok' if f else 'pending'}
    with open(mp, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=['key', 'url', 'file', 'status'])
        w.writeheader()
        w.writerows(old[k] for k in sorted(old))

    ok = sum(1 for v in old.values() if v['status'] == 'ok')
    bad = [v for v in old.values() if v['status'].startswith('FAIL')]
    print(f'\n完成：成功 {ok} / {len(seen)}，失敗 {len(bad)}')
    for v in bad:
        print('  失敗', v['key'], v['url'], '|', v['status'])
    if bad:
        print('可再執行 python tools/download_images.py --retry 重試。')


if __name__ == '__main__':
    main()
