const express = require('express');
const line = require('@line/bot-sdk');
const { lineConfig, port } = require('./config');
const { handleTextMessage } = require('./handlers/messageHandler');
const { handlePostback } = require('./handlers/postbackHandler');
const { startScheduler, checkAndNotify } = require('./services/feeChecker');

const app = express();

// ---- LINE Webhook ----
// 注意：line.middleware 必須用 raw body 驗證簽章，不可在此路由前先掛 express.json()
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook 處理錯誤：', err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  // 方便您第一次串接時，把使用者 / 管理員的 userId 印出來，複製到 .env 的 ADMIN_USER_IDS
  console.log('event:', JSON.stringify(event));

  if (event.type === 'message' && event.message.type === 'text') {
    return handleTextMessage(event);
  }
  if (event.type === 'postback') {
    return handlePostback(event);
  }
  // 其他事件類型（加好友、封鎖等）可依需求擴充
  return null;
}

// ---- 健康檢查 ----
app.get('/', (req, res) => res.send('LINE Bot server is running.'));

// ---- 手動觸發一次進駐費檢查（測試用，正式環境建議加驗證或移除）----
app.get('/admin/run-fee-check', async (req, res) => {
  await checkAndNotify();
  res.send('已手動執行一次進駐費檢查');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startScheduler();
});
