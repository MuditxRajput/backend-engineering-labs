function generateShortUrlRequest(context, events, done) {
  const id = Math.floor(Math.random() * 100000000);

  context.vars.longUrl = `https://example.com/page/${id}`;

  return done();
}

module.exports = { generateShortUrlRequest };
