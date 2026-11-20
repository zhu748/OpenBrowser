const genericMessage = /^(操作成功|操作失败|成功|失败|success|ok)$/i;
function actionMessage(error, fallback) {
  const detail = String(error?.message || error || '').trim();
  return !detail || genericMessage.test(detail) ? fallback : detail;
}

export { actionMessage as t };
