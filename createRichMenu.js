/**
 * 執行方式：npm run create-richmenu
 * 前置條件：
 *   1. .env 已設定 CHANNEL_ACCESS_TOKEN
 *   2. 這個資料夾底下要放一張 richmenu-image.png（2500x1686，或與 richMenuConfig.js 的 size 一致）
 */
const fs = require('fs');
const path = require('path');
const client = require('../services/lineClient');
const richMenuConfig = require('./richMenuConfig');

async function main() {
  const imagePath = path.join(__dirname, 'richmenu-image.png');
  if (!fs.existsSync(imagePath)) {
    console.error(
      `找不到圖片：${imagePath}\n請先準備一張 ${richMenuConfig.size.width}x${richMenuConfig.size.height} 的 PNG 圖檔，命名為 richmenu-image.png 放在 richmenu 資料夾內。`
    );
    process.exit(1);
  }

  console.log('建立 Rich Menu...');
  const richMenuId = await client.createRichMenu(richMenuConfig);
  console.log('建立成功，richMenuId =', richMenuId);

  console.log('上傳 Rich Menu 圖片...');
  const buffer = fs.readFileSync(imagePath);
  await client.setRichMenuImage(richMenuId, buffer, 'image/png');

  console.log('設定為預設 Rich Menu（所有使用者都會看到）...');
  await client.setDefaultRichMenu(richMenuId);

  console.log('完成！Rich Menu 已上線。');
}

main().catch((err) => {
  console.error('建立 Rich Menu 失敗：', err.response?.data || err.message);
  process.exit(1);
});
