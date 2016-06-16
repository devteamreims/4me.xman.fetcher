let lastRequest = {
  when: null,
  rawResponse: null,
  error: null,
};

export function getStatus(req, res, next) {

  res.send({
    lastRequest,
    version: process.env.npm_package_version,
  });
}

export function setStatus(response, error = null) {
  lastRequest = Object.assign({}, lastRequest, {
    when: Date.now(),
    rawResponse: response,
    error,
  });
  return lastRequest;
}
