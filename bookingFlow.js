const db = require('../services/db');

// 產生「未來7天」的日期選單（quick reply）
function buildDatePicker() {
  const items = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = `${dateStr.slice(5)} (${'日一二三四五六'[d.getDay()]})`;
    items.push({
      type: 'action',
      action: {
        type: 'postback',
        label,
        data: `action=pick_date&date=${dateStr}`,
        displayText: `我要查詢 ${dateStr} 的會議室`,
      },
    });
  }
  return {
    type: 'text',
    text: '請選擇您要租借會議室的日期：',
    quickReply: { items },
  };
}

// 根據日期產生會議室可用狀態選單
function buildRoomPicker(dateStr) {
  const availability = db.getAvailability(dateStr);
  const items = availability
    .filter((r) => r.status === 'available')
    .map((r) => ({
      type: 'action',
      action: {
        type: 'postback',
        label: r.roomName.slice(0, 20),
        data: `action=pick_room&date=${dateStr}&roomId=${r.roomId}`,
        displayText: `我要租借 ${r.roomName}`,
      },
    }));

  const statusText = availability
    .map((r) => {
      const statusLabel = { available: '✅ 可租借', pending: '🕓 審核中', approved: '❌ 已被租走' }[
        r.status
      ];
      return `${r.roomName}：${statusLabel}`;
    })
    .join('\n');

  if (items.length === 0) {
    return {
      type: 'text',
      text: `${dateStr} 目前狀況：\n${statusText}\n\n很抱歉，這天所有會議室都已被租借或審核中。輸入「會議室」可重新選擇日期。`,
    };
  }

  return {
    type: 'text',
    text: `${dateStr} 目前狀況：\n${statusText}\n\n請選擇要租借的會議室：`,
    quickReply: { items },
  };
}

module.exports = { buildDatePicker, buildRoomPicker };
