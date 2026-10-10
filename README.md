# 開拓者繳稅紀錄簿

給 AZKi 粉絲「開拓者」們使用的周邊收集清單（非官方粉絲網站）。

## 檔案結構

```
index.html      頁面
css/style.css   樣式（主色 #d11c76 / #f4348b / #FC3488）
js/app.js       讀取 CSV、分組、篩選、繳稅紀錄
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
