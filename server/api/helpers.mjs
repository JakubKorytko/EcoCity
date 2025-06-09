async function json(req) {
  let body = "";

  try {
    for await (const chunk of req) {
      body += chunk;
    }
    body = JSON.parse(body);
  } catch {
    body = {};
  }

  return body;
}

export { json };
