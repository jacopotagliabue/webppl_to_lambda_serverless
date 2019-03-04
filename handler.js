const webppl = require('webppl');

// this lambda function simply returns the static html page for the one-page app
module.exports.app = (event, context, callback) => {
    // just print the event to cloudwatch for debug/inspection
    console.log(event);

    const html = `
    <html>
    <body>
      <h1>WebPPL App</h1>
    </body>
    </html>`;

    const response = {
        statusCode: 200,
        headers: {'Content-Type': 'text/html'},
        body: html
    };

   callback(null, response);
};

// this is a wrapper to prepare a JSON response for lambda endpoint
const replyJson = (callback, statusCode, body) => {
    callback(null, {
        statusCode,
        body: JSON.stringify(body)
    });
};

// this lambda function returns the webppl model response
module.exports.model = (event, context, callback) => {
    // just print the event to cloudwatch for debug/inspection
    console.log(event);

    const code = `
        var roll = Infer({
          method: 'enumerate',
          model() {
            var die1 = randomInteger(6) + 1;
            var die2 = randomInteger(6) + 1;
        
            return die1 + die2;
          }
        });
        
        map(function(x) {
          return {x: x, p: Math.exp(roll.score(x))};
        }, roll.support());`;

    // running webppl code
    webppl.run(code, (s, val) => {
        replyJson(callback, 200, { s, val });
    });

};

