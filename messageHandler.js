const client = require('../services/lineClient');
const session = require('../services/sessionStore');
const db = require('../services/db');
const { contactInfo, adminUserIds } = require('../config');
const { buildDatePicker } = require('./bookingFlow');
const { notifyAdminsNewBooking } = require('./notify');

async function handleTextMessage(event) {
  const userId = event.source.userId;
  const text = event.message.text.trim();
  const state = session.get(userId);

  // ---- 若使用者正處於「輸入時段/用途」的步驟，優先處理 ----
  if (state && state.step === 'awaiting_timeslot') {
    state.data.timeSlot = text;
    state.step = 'awaiting_purpose';
    session.set(userId, state);
    return reply(event, '請簡述租借用途（例如：部門週會、廠商洽談）：');
  }

  if (state && state.step === 'awaiting_purpose') {
    state.data.purpose = text;
    const booking = db.createBooking({
      roomId: state.data.roomId,
      date: state.data.date,
      timeSlot: state.data.timeSlot,
      purpose: state.data.purpose,
      applicantName: event.source.userId, // 建議之後改抓 LINE 顯示名稱或綁定的廠商名稱
      applicantUserId: userId,
    });
    session.clear(userId);

    await notifyAdminsNewBooking(booking);

    return reply(
      event,
      `已收到您的租借申請！\n單號：${booking.id}\n日期：${booking.date}\n時段：${booking.timeSlot}\n用途：${booking.purpose}\n\n審核結果將透過 LINE 通知您，請耐心等候。`
    );
  }

  // ---- 關鍵字自動回覆 ----
  if (matchKeyword(text, ['會議室', '租借會議室', '會議室租借'])) {
    session.clear(userId);
    return reply(event, buildDatePicker());
  }

  if (matchKeyword(text, ['聯絡我們', '聯絡方式', 'contact'])) {
    return reply(event, { type: 'text', text: `📞 管理單位聯絡方式\n${contactInfo}` });
  }

  if (matchKeyword(text, ['人工', '真人', '轉真人', '客服'])) {
    session.set(userId, { step: 'human_handoff', data: {} });
    await notifyAdmins(
      `⚠️ 使用者要求轉真人客服\nuserId: ${userId}\n請管理人員盡快私訊或撥打電話聯繫。`
    );
    return reply(event, {
      type: 'text',
      text: '已為您通知管理人員，將盡快有專人與您聯繫。若急件請直接撥打客服電話。',
    });
  }

  if (matchKeyword(text, ['我的進駐費', '繳費查詢', '進駐費'])) {
    const vendor = db.getVendorByUserId(userId);
    if (!vendor) {
      return reply(event, {
        type: 'text',
        text: '查無您的廠商資料，若您是廠商窗口，請聯繫管理處協助綁定 LINE 帳號。',
      });
    }
    const statusLabel = { unpaid: '尚未繳費', paid: '已繳費' }[vendor.status] || vendor.status;
    return reply(event, {
      type: 'text',
      text: `【進駐費查詢】\n廠商：${vendor.name}\n應繳金額：NT$ ${vendor.amount}\n應繳日期：${vendor.dueDate}\n狀態：${statusLabel}`,
    });
  }

  // ---- 預設回覆 ----
  return reply(event, {
    type: 'text',
    text: '您好！可以輸入以下關鍵字：\n「會議室」查詢/租借會議室\n「我的進駐費」查詢繳費狀態\n「聯絡我們」看管理單位聯絡方式\n「人工」轉真人客服',
  });
}

function matchKeyword(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

async function notifyAdmins(text) {
  if (!adminUserIds.length) return;
  await client.multicast(adminUserIds, [{ type: 'text', text }]);
}

function reply(event, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return client.replyMessage(event.replyToken, msgs);
}

module.exports = { handleTextMessage, notifyAdmins, reply };
