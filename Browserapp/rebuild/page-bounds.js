"use strict";

function pageBounds(pageNumber, pageSize) {
  const page = Number(pageNumber), limit = Number(pageSize);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 5000)
    throw Error("分页参数无效，单页范围 1–5000");
  return { offset: (page - 1) * limit, limit };
}

module.exports = { pageBounds };
