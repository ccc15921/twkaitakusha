# 開拓者繳稅紀錄簿

給 AZKi 粉絲「開拓者」們使用的周邊收集清單（非官方粉絲網站）。

## 檔案結構

```
index.html           繳稅紀錄簿（周邊）
voice.html           Voice 收集簿
css/style.css        兩頁共用樣式（主色 #d11c76 / #f4348b / #FC3488）
js/app.js            繳稅紀錄簿：讀取 CSV、分組、篩選、繳稅紀錄
js/voice.js          Voice 收集簿：讀取 AZKi voice 分頁 CSV、分組、篩選、收集紀錄
log.html             網頁更新日記（更新紀錄＋尚未加入的周邊企劃）
js/log.js            更新日記：讀取兩個 CSV 分頁並顯示
js/transfer.js       紀錄轉移的編碼／解碼與 QR Code（繳稅紀錄簿用）
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
