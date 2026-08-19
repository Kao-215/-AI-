const client = require('../services/lineClient');
const session = require('../services/sessionStore');
const db = require('../services/db');
const { adminUserIds } = require('../config');
const { buildRoomPicker } = require('./bookingFlow');
const { notifyApplicantResult } = require('./notify');

async function handlePostback(event) {
  const userId = event.source.userId;
  const params = new URLSearchParams(event.postback.data);
  const action = params.get('action');

  if (action === 'pick_date') {
    const date = params.get('date');
    return reply(event, buildRoomPicker(date));
  }

  if (action === 'pick_room') {
    const date = params.get('date');
    const roomId = params.get('roomId');
    session.set(userId, { step: 'awaiting_timeslot', data: { date, roomId } });
    return reply(event, {
      type: 'text',
      text: '請輸入希望租借的時段（例如：14:00-16:00）：',
    });
  }

  if (action === 'review') {
    // 僅允許管理人員操作
    if (!adminUserIds.includes(userId)) {
      return reply(event, { type: 'text', text: '您沒有審核權限。' });
    }
    const bookingId = params.get('bookingId');
    const decision = params.get('decision'); // approved / rejected
    const booking = db.updateBookingStatus(bookingId, decision);

    if (!booking) {
      return reply(event, { type: 'text', text: `找不到申請單號 ${bookingId}` });
    }

    await notifyApplicantResult(booking);

    const decisionLabel = decision === 'approved' ? '核准' : '不核准';
    return reply(event, {
      type: 'text',
      text: `已將單號 ${bookingId} 標記為「${decisionLabel}」，並通知申請人。`,
    });
  }

  return reply(event, { type: 'text', text: '無法辨識的操作，請重新選擇。' });
}

function reply(event, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return client.replyMessage(event.replyToken, msgs);
}

module.exports = { handlePostback };
