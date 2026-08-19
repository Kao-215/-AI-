# LINE Bot：會議室租借 + 進駐費催繳

一套可直接跑起來的 Node.js + Express 骨架，實作您描述的兩個功能：
會議室租借（含行事曆查詢、申請、審核、通知）與進駐費催繳（每日自動檢查、到期前提醒、查詢），
並包含關鍵字自動回覆（會議室 / 我的進駐費 / 聯絡我們 / 人工）。

## 目前用什麼技術

- **Node.js + Express**：Webhook server
- **@line/bot-sdk**：LINE 官方 SDK，處理訊息、Postback、Rich Menu、Push/Reply
- **lowdb**（JSON 檔）：示範用資料庫，**正式上線請換成 MySQL / PostgreSQL / Firestore**
  （只要改 `services/db.js` 內的實作，其他程式碼完全不用動）
- **node-cron**：每天定時檢查進駐費到期狀況

## 資料夾結構

```
line-bot/
├── server.js              # 主程式、Webhook 入口
├── config.js               # 環境變數集中管理
├── .env.example             # 環境變數範例
├── data/db.json             # 假資料（會議室、廠商）
├── services/
│   ├── db.js                # 資料存取層（之後換真資料庫改這裡）
│   ├── lineClient.js         # LINE SDK client
│   ├── sessionStore.js       # 記錄使用者對話進度（記憶體版）
│   └── feeChecker.js         # 每日排程：檢查進駐費、發送提醒
├── handlers/
│   ├── messageHandler.js     # 文字訊息＋關鍵字自動回覆
│   ├── postbackHandler.js    # 按鈕點擊事件（選日期/選會議室/審核）
│   ├── bookingFlow.js        # 產生日期/會議室選單訊息
│   └── notify.js             # 所有推播通知邏輯集中在這
└── richmenu/
    ├── richMenuConfig.js     # Rich Menu 版面設定（4個按鈕）
    └── createRichMenu.js     # 上傳 Rich Menu 的腳本
```

## 安裝與啟動

```bash
cd line-bot
npm install
cp .env.example .env
# 編輯 .env，填入 CHANNEL_ACCESS_TOKEN / CHANNEL_SECRET
npm start
```

需要對外網址讓 LINE 打得到 webhook，本機測試可用 ngrok：

```bash
ngrok http 3000
```

把 ngrok 給的網址（例如 `https://xxxx.ngrok.io/webhook`）填到
LINE Developers Console → Messaging API → Webhook URL，並開啟 "Use webhook"。

## 設定管理人員（審核者）

1. 先讓管理人員的 LINE 帳號加 Bot 好友，隨便傳一句話。
2. 看 server 的 log，會印出 `event: {"source":{"userId":"U....."}}`，複製這個 `userId`。
3. 貼到 `.env` 的 `ADMIN_USER_IDS`（多人用逗號分隔）。
4. 重啟 server。之後有新的租借申請，會自動 push 給所有管理人員，並附上「核准／不核准」按鈕。

## 設定 Rich Menu（選單功能）

1. 自行設計一張 2500x1686 的選單圖片（可用 Canva / Figma），分成四個等分區塊，
   對應「會議室租借」「進駐費查詢」「聯絡我們」「人工」。
2. 存成 `richmenu/richmenu-image.png`。
3. 執行：
   ```bash
   npm run create-richmenu
   ```
4. 之後所有加好友的使用者都會看到這個選單（`setDefaultRichMenu`）。

如果要「不同角色看到不同選單」（例如廠商 vs 一般訪客），需要改用
`linkRichMenuToUser` 針對特定 userId 綁定不同選單，目前骨架先用單一預設選單示範。

## 會議室租借的完整流程

1. 使用者輸入「會議室」或點選單 → Bot 傳出未來7天的日期按鈕
2. 選日期 → Bot 顯示當天各會議室狀態（可租借 / 審核中 / 已租走），並列出可選的會議室
3. 選會議室 → Bot 詢問時段 → 使用者輸入時段（純文字，例如 14:00-16:00）
4. Bot 詢問用途 → 使用者輸入用途
5. 系統建立申請單（狀態 pending），Push 通知所有管理人員（含核准/不核准按鈕）
6. 管理人員按下按鈕 → 系統更新申請單狀態、更新行事曆 → Push 通知申請人「申請成功／不通過」

> 目前「行事曆」是用文字列出當天各會議室狀態，不是圖形化月曆。
> 如果您想要圖形化的月曆介面，建議做成 **LIFF（LINE 內嵌網頁）**，
> 我可以再幫您加這個部分，會比純文字/按鈕的體驗更好。

## 進駐費催繳的完整流程

1. `data/db.json` 的 `vendors` 陣列存廠商資料：名稱、應繳金額、應繳日期、繳費狀態、`userId`（需綁定廠商的 LINE 帳號）
2. `services/feeChecker.js` 每天依 `.env` 的 `FEE_CHECK_CRON`（預設每天早上9點）自動檢查一次
3. 依 `.env` 的 `FEE_REMINDER_DAYS_BEFORE`（預設到期前7/3/1天）各發送一次提醒，避免重複發送同一天的提醒
4. 廠商可隨時輸入「我的進駐費」查詢目前應繳金額與狀態
5. 廠商繳費後，需要有人（管理人員後台，或您之後要做的其他機制）把 `status` 改成 `paid`，
   目前骨架尚未包含金流串接或後台介面，可用 `db.updateVendorStatus(vendorId, 'paid')` 手動呼叫

想立刻手動測試排程效果（不用等到明天9點），可以打：
```
GET http://localhost:3000/admin/run-fee-check
```

## 接下來建議做的事（目前骨架尚未包含）

| 項目 | 說明 |
|---|---|
| 真正的資料庫 | 目前是本機 JSON 檔，多人同時使用或重啟會有資料遺失風險，建議換 MySQL/PostgreSQL |
| 廠商 userId 綁定機制 | 目前需手動把廠商 LINE userId 寫進資料庫，建議做一個簡單的「輸入廠商編號 + 驗證碼綁定」流程 |
| 管理後台介面 | 目前審核靠 LINE 按鈕，若要看報表、批次管理，建議做一個網頁後台 |
| 圖形化行事曆（LIFF） | 目前用文字/按鈕呈現行事曆，體驗較陽春，可做成月曆網頁 |
| 金流串接 | 若進駐費要線上繳費，需接金流（綠界/藍新等）並在付款完成後自動更新狀態 |
| 部署 | 建議部署到 Render / Railway / GCP Cloud Run，記得資料庫也要換成雲端服務 |

有需要我可以接著把「圖形化 LIFF 月曆」或「換成 MySQL」這兩塊也做出來。
