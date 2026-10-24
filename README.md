# 開拓者繳稅紀錄簿

給 AZKi 粉絲「開拓者」們使用的周邊收集清單（非官方粉絲網站）。

## 檔案結構

```
index.html           繳稅紀錄簿（周邊）
voice.html           Voice 收集簿
css/style.css        兩頁共用樣式（主色 #d11c76 / #f4348b / #FC3488）
js/app.js            繳稅紀錄簿：讀取 CSV、分組、篩選、繳稅紀錄
js/voice.js          Voice 收集簿：讀取 AZKi voice 分頁 CSV、分組、篩選、收集紀錄
tools/download_images.py  把 CSV 裡所有縮圖下載備份到 img_backup/
card.html            會員証產生器
js/card.js           會員証：在底圖寫上名字／編號並下載 PNG
img/                 會員証底圖（card.png 含預設編號、card_blank.png 已去除編號）
log.html             網頁更新日記（更新紀錄＋尚未加入的周邊企劃）
js/log.js            更新日記：讀取兩個 CSV 分頁並顯示
js/transfer.js       紀錄轉移的編碼／解碼與 QR Code（繳稅紀錄簿用）
js/cloud.js          Google 登入與雲端同步（Supabase）
js/vendor/supabase.js  supabase-js 2.117.2（第三方，MIT）
supabase/            資料庫建置 SQL（在 Supabase 後台 SQL Editor 依編號執行）
.github/workflows/    GitHub Actions（Supabase 保持活躍）
js/vendor/qrcode.js  QR Code 產生器（第三方，MIT）
```

## 部署到 GitHub Pages

1. 建立 repo，把這三個檔案（含資料夾）放在根目錄。
2. Settings → Pages → Source 選 `Deploy from a branch`，分支 `main`、資料夾 `/ (root)`。
3. 幾分鐘後網址會是 `https://<帳號>.github.io/<repo>/`。

## 資料怎麼更新

網頁每次開啟都直接讀 Google 試算表發佈的 CSV，所以**改試算表就好，不用重新部署**（Google 發佈的 CSV 約有 5 分鐘快取）。
CSV 網址在 `js/app.js` 最上面的 `CSV_URL`。

### 讀取規則

- 以 `goods project code` 分組成一個企劃。
- `goods index` 為 0 或沒有 `goods name` 的列 = 企劃封面；企劃名稱、日期、網址以封面列為準。
- 每件周邊的紀錄鍵是 `企劃代號#goods index`，**已上線後請不要更改既有周邊的代號或編號**，否則使用者的勾選紀錄會對不上。
- `price` 可含千分位逗號；`date` 接受 `2025/7/1`、`2025/07/01` 等格式。
- `goods type`：`acrylic stand` 壓克力立牌、`badge` 徽章、`plushie` 娃娃、`keychain` 吊飾；其他值會原樣顯示成篩選選項。
- `oversea` 填 yes / true 即標為海外合作。

## 語言與主題

- 介面提供繁體中文／日文，右上角切換；預設依瀏覽器語言，選擇會記在瀏覽器裡。所有介面文字集中在 `js/app.js` 的 `I18N`，要改字或加語言只改那裡。
- 企劃名、周邊名、備註直接取自 CSV，不做翻譯。
- 深色模式預設跟隨系統，右上角按鈕可手動切換。

## 繳稅紀錄

勾選紀錄存在使用者自己瀏覽器的 localStorage，換裝置或清除瀏覽資料會不見，可用「匯出備份 / 匯入備份」搬移。
備份檔格式為 `{"owned": {"企劃代號#編號": 數量}}`，例如 `{"azki_bd2026#3": 2}` 代表買了 2 個。
舊版備份檔的 `true` 會自動視為 1 個，可以直接匯入。

### 轉移到其他裝置（連結 + QR Code）

篩選區的「轉移到其他裝置」會把紀錄壓縮後放進網址的 `#t=` 後面並產生 QR Code，另一台裝置掃描或開啟連結，選「合併」或「取代」即可匯入。

- 不需要伺服器或帳號：網址 `#` 後面的內容不會被送到 GitHub，資料只存在連結本身。
- 連結內含收藏紀錄（企劃代號、編號、數量；不含金額），請只傳給自己。
- 「合併」同一件周邊取較大的數量，不會刪掉原有紀錄；「取代」則完全覆蓋。
- 這是一次性的快照，不是自動同步；兩邊都有更動時要再轉移一次。
- 連結含 CRC32 校驗，被聊天軟體截斷或損壞時會直接拒絕，不會匯入不完整的資料。
- 格式與編碼在 `js/transfer.js`；QR Code 由 `js/vendor/qrcode.js`（[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)，MIT 授權）產生，已放在專案內，不依賴外部 CDN。
- 實測：約 270 件、含長企劃代號的紀錄，連結約 1200 字元，QR Code 可正常掃描。

## Voice 收集簿（voice.html）

- 資料來自同一份試算表的 AZKi voice 分頁（CSV 網址在 `js/voice.js` 最上面的 `CSV_URL`）。
- 欄位：`project code`、`project name`、`date`、`voice name`、`price`、`project website link`、`picture link`。
- 以 `project code` 分組成一個企劃；企劃名稱、日期、網址、封面取該企劃第一列。
- 這一頁**不計算金額**，只記錄收集了哪些 Voice。
- 紀錄鍵是 `企劃代號#Voice 名稱`（忽略空白與全半形括號差異）。**已上線後請不要改既有 Voice 的名稱或企劃代號**，否則勾選紀錄會對不上。
- 企劃名稱以「AZKi」或「スターティングボイス AZKi」開頭會標成「AZKi 個人」，名稱含「再販」會標成「再販」。
- 收集紀錄存在 localStorage（`azki-voice-v1`），和繳稅紀錄簿分開，備份檔也分開匯出／匯入。語言與深色模式設定兩頁共用。

## 網頁更新日記（log.html）

- 資料來自同一份試算表的兩個分頁（網址在 `js/log.js` 最上面，以 `gid` 區分）：
  - **更新紀錄**（`gid=2087235395`）：欄位 `date`、`note`。依日期新 → 舊排列；`note` 可含換行，網址會自動變成連結。
  - **尚未加入的周邊企劃**（`gid=1081125265`）：欄位 `TODO`（企劃名稱）、`Website`（官方商店網址）。企劃加進繳稅紀錄簿後，把該列從試算表刪掉即可。
- 這一頁沒有使用者紀錄，只讀取顯示。
- 頁尾的「最後更新」日期是寫在各 html 檔裡的固定文字，改版時要一起手動更新。

## 縮圖備份（img_backup/）

網頁上的圖片是直接連到來源網站（官方商店等），來源改版或下架時圖會消失，所以可以用腳本把全部縮圖備份下來：

```
python tools/download_images.py
```

- 在 `twkaitakusha` 資料夾內執行，只用 Python 內建模組。預設讀取 `js/app.js` 的 `CSV_URL`，也可用 `--csv 檔案` 指定本機 CSV。
- 檔名為 `企劃代號_編號.副檔名`（編號 0 = 企劃封面），例如 `aziro_commemorativemerch_0.png`。
- 可重複執行，已下載的會略過；`--retry` 只重試失敗的。結果記錄在 `img_backup/manifest.csv`。
- 備份只是存檔用，網頁目前仍使用原本的圖片網址。
- 圖片著作權屬於 COVER 株式会社及各權利人；若 repo 是公開的，上傳備份等於公開轉載，請自行評估（也可以把 `img_backup/` 加進 `.gitignore`，只留在本機）。

## 會員証產生器（card.html）

- **目前為隱藏頁面**：導覽列沒有連結，只能直接輸入網址 `…/card.html` 進入，並加了 `noindex` 避免被搜尋引擎收錄。要公開時，在各頁導覽列加上 `<li><a href="card.html" data-i18n="nav.card">會員証</a></li>` 即可（`nav.card` 文字已經在各頁的 I18N 裡）。
- 名字可用滑桿在欄位內左右移動，另有「置中」按鈕。

- 使用者輸入名字，網頁用 `<canvas>` 把名字畫在底圖的 Name 欄，按「下載圖片」存成 PNG（輸出為底圖的 2 倍大小）。名字與編號只在瀏覽器內處理，不會上傳。
- 會員編號選項：預設（圖上原本的 00001234）、自己輸入（最多 8 位數字，不足補 0）、隨機產生、不顯示。後三種使用 `img/card_blank.png`（編號已去除）再畫上金色數字。
- 名字太長會自動縮小字體；版面座標集中在 `js/card.js`：Name 欄 `NAME_BOX`、編號位置 `NUM_X0`／`NUM_PITCH`／`NUM_Y0`，換底圖時只要改這裡。
- 名字字體可選：黑體（Noto Sans TC/JP）、圓體（Chiron GoRound TC／M PLUS Rounded 1c）、明體（Noto Serif TC/JP）、楷體手寫（LXGW WenKai TC／Klee One）、粗圓流行（Dela Gothic One）、英文手寫（Pacifico）。編號不使用字體，而是依原圖數字的形狀用線條畫出 0–9（`js/card.js` 的 `GLYPHS`）。全部來自 Google Fonts，在 `card.html` 各自用獨立的 `<link>` 載入（其中一個失敗不會影響其他字體）；字體清單在 `js/card.js` 的 `FONTS`。
- 底圖若要換成更大的原圖，直接覆蓋 `img/card.png`；`img/card_blank.png` 需同尺寸、且把右下角編號去掉。

## 會員登入與雲端同步（Supabase）

- 只支援 Google 登入。未登入時一切照舊，紀錄只存在瀏覽器。
- 設定集中在 `js/cloud.js` 最上面：`SUPABASE_URL`、`SUPABASE_KEY`（publishable key，本來就可以公開）。**不要**把 `service_role`／secret key 或 Google 用戶端密鑰放進 repo。
- 資料庫：在 Supabase 後台 **SQL Editor** 執行 `supabase/001_init.sql`（可重複執行）。建立 `records`（紀錄）、`profiles`（個人資料，先預留給排行榜）與權限規則（每個人只能讀寫自己的紀錄）。
- 同步規則：本機修改先記成「待同步」約 1 秒後送出；雲端為正本。這台裝置第一次和帳號連結時，兩邊都有不同紀錄會讓使用者選「合併（同一件取較大數量）」或「以雲端為準」。登出保留本機紀錄，下次登入重新比較。
- 繳稅紀錄簿（`book=ledger`）與 Voice 收集簿（`book=voice`，收集＝數量 1）都會同步；更新日記頁只顯示登入狀態。每本紀錄各自記錄「這台裝置是否已和帳號連結」，第一次在某頁登入時才比較那一本。
- 刪除帳號：頭像選單最下方「刪除帳號」，勾選確認後呼叫資料庫函式 `delete_my_account()`，連同所有雲端紀錄與個人資料一起刪除（本機紀錄保留）。需先執行 `supabase/002_account_keepalive.sql`。
- 保持活躍：`.github/workflows/keepalive.yml` 每 3 天呼叫 `keepalive()`，避免免費專案閒置一週被暫停；可在 GitHub 的 Actions 分頁手動執行測試。注意 GitHub 會在 repo 連續 60 天沒有任何活動時自動停用排程，屆時到 Actions 分頁重新啟用即可。
- 詳細規劃見 Project 文件「會員系統規劃（Supabase）」。
