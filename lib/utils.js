function responseInfo(res, options) {
  let config = Object.assign({
    code: 0,
    codeText: 'OK'
  }, options);
  res.status(200).type('application/json').send(config);
}

// 自增长ID
function createID (data) {
  return data.length === 0 ? 1 : (parseInt(data[data.length - 1]['_id']) + 1)
}

module.exports = {
  responseInfo,
  createID
}
