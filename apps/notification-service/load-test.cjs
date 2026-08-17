function generateNotification(context, events, done) {
  const id = Math.floor(Math.random() * 100000000);

  context.vars.userId = id;
  context.vars.recipient = `user${id}@example.com`;
  context.vars.orderId = id;
  context.vars.customerName = `Customer ${id}`;
  context.vars.amount = Math.floor(Math.random() * 5000) + 100;
  context.vars.paymentId = `pay_${id}`;

  return done();
}

module.exports = { generateNotification };
