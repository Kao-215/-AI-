const client = require('../services/lineClient');
const { adminUserIds } = require('../config');
const db = require('../services/db');

// 有新的租借申請時，通知所有管理人員，並附上「核准／不核准」按鈕
async function notifyAdminsNewBooking(booking) {
  if (!adminUserIds.length) {
    console.warn('尚未設定 ADMIN_USER_IDS，無法通知管理人員');
    return;
  }

  const room = db.getRooms().find((r) => r.id === booking.roomId);

  const flexMessage = {
    type: 'flex',
    altText: `新的會議室租借申請：${booking.id}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '📅 新的會議室租借申請', weight: 'bold', size: 'md' },
          { type: 'text', text: `單號：${booking.id}`, size: 'sm', margin: 'md' },
          { type: 'text', text: `會議室：${room ? room.name : booking.roomId}`, size: 'sm' },
          { type: 'text', text: `日期：${booking.date}`, size: 'sm' },
          { type: 'text', text: `時段：${booking.timeSlot}`, size: 'sm' },
          { type: 'text', text: `用途：${booking.purpose}`, size: 'sm', wrap: true },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#06C755',
            action: {
              type: 'postback',
              label: '核准',
              data: `action=review&bookingId=${booking.id}&decision=approved`,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '不核准',
              data: `action=review&bookingId=${booking.id}&decision=rejected`,
            },
          },
        ],
      },
    },
  };

  await client.multicast(adminUserIds, [flexMessage]);
}

// 管理人員審核後，通知申請人結果
async function notifyApplicantResult(booking) {
  const resultText = booking.status === 'approved' ? '✅ 申請成功' : '❌ 申請不通過';
  await client.pushMessage(booking.applicantUserId, {
    type: 'text',
    text: `【會議室租借審核結果】\n單號：${booking.id}\n日期：${booking.date} ${booking.timeSlot}\n結果：${resultText}`,
  });
}

// 進駐費繳費提醒
async function notifyVendorFeeReminder(vendor, daysBefore) {
  if (!vendor.userId) {
    console.warn(`廠商 ${vendor.name} 尚未綁定 LINE userId，無法發送提醒`);
    return;
  }
  await client.pushMessage(vendor.userId, {
    type: 'text',
    text: `【進駐費繳費提醒】\n廠商：${vendor.name}\n應繳金額：NT$ ${vendor.amount}\n應繳日期：${vendor.dueDate}（尚有 ${daysBefore} 天）\n請盡快完成繳費，如已繳費請忽略此訊息，或輸入「人工」聯繫管理處確認。`,
  });
}

module.exports = { notifyAdminsNewBooking, notifyApplicantResult, notifyVendorFeeReminder };
