var amqp = require('amqplib/callback_api');

var amqpConn = null;
amqp.connect("amqp://localhost" + "?heartbeat=60", function(err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
    }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function() {
      console.error("[AMQP] reconnecting");
    });

    console.log("[AMQP] connected");
    amqpConn = conn;
    var urlSubscriber = require('./subscribers/subscriber.url')(amqpConn);

    urlSubscriber.StartSubscriber();

  });
