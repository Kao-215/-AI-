/**
 * Rich Menu 版面設定
 * 圖片尺寸建議 2500 x 1686（LINE 官方建議尺寸），這裡切成上下各2格、共4個按鈕。
 * 圖片本身（richmenu-image.png）需要您自行設計，放在同一個資料夾底下，
 * 尺寸與這裡的 area 座標要對應。
 */
module.exports = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: '主選單',
  chatBarText: '選單',
  areas: [
    {
      // 左上：會議室租借
      bounds: { x: 0, y: 0, width: 1250, height: 843 },
      action: { type: 'message', text: '會議室' },
    },
    {
      // 右上：進駐費查詢
      bounds: { x: 1250, y: 0, width: 1250, height: 843 },
      action: { type: 'message', text: '我的進駐費' },
    },
    {
      // 左下：聯絡我們
      bounds: { x: 0, y: 843, width: 1250, height: 843 },
      action: { type: 'message', text: '聯絡我們' },
    },
    {
      // 右下：轉真人客服
      bounds: { x: 1250, y: 843, width: 1250, height: 843 },
      action: { type: 'message', text: '人工' },
    },
  ],
};
