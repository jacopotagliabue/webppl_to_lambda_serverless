const webppl = require('webppl');

// this lambda function simply returns the static html page for the one-page app
module.exports.app = (event, context, callback) => {
    // just print the event to cloudwatch for debug/inspection
    console.log(event);

    const html = `
    <html>
    <head>
        <title>WebPPL-to-AWS-lambda App</title>
        <meta charset="UTF-8"> 
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.4.0/Chart.min.js"></script>
        <link rel="icon" href="https://tooso.ai/assets/favicon.ico" />
        <style>

        </style>
    </head>
    <body>
      <h1>WebPPL App</h1>
      <div>
        <input type="button" value="Probabilistic magic!" id="WebPPLBtn" />
      </div>
      <div id="graph-container"></div>
    </body>
    <script>
        $("#WebPPLBtn" ).click(function() {
            
            $.ajax({
              url: "/dev/model",
              dataType: 'json',
              success: function(data) {
                console.log("Drawing line chart with..." + data);
                var chartData = [];
                $.each(data['val'], function(index, series) {
                     chartData.push({
                            label: "Sample " + (index + 1),
                            fill: false,
                            borderColor: 'rgb(' + [randomRGB(), randomRGB(), randomRGB()].join() + ')',
                            data: series
                        })
                    });
                drawLineChart(chartData);
              },
              error: function(err) { alert("Error: "+ err); }
            });  
        });
        
        var randomIntInRange = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        
        var randomRGB = function() {
            return randomIntInRange(0, 256);
        };
        
        var drawLineChart = function(data) {
            $('#gpPriorsCanvas').remove();
            $('#graph-container').append('<canvas id="gpPriorsCanvas" height="540" width="960"><canvas>');
            var ctx = document.getElementById('gpPriorsCanvas').getContext('2d');
            var chart = new Chart(ctx, {
                type: 'scatter',
                data: { datasets: data },
                options: { responsive: false }
            });
        };
    </script>
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

    // set some default value
    var xStart = -4;
    var xEnd = -4;
    var xStep = 0.5;
    var nSeries = 4; // we are just faking this to be compulsory


    // if no param at all or missing a mandatory one, throw error
    if (!event.queryStringParameters || !event.queryStringParameters.nSeries) {
        var errorMessage = "Mandatory parameters are missing! Query parameters received: " + event.queryStringParameter;

        // var error = new Error(errorMessage);
        // if you return this, the string gets logged to cloudwatch -> https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-mode-exceptions.html
        // callback(error);

        // wrap error around JSON
        replyJson(callback, 503, {error: errorMessage});
    }
    else {
        // overwrite params if there
        xStart = event.queryStringParameters.xStart ? event.queryStringParameters.xStart : xStart;
        xEnd = event.queryStringParameters.xEnd ? event.queryStringParameters.xEnd : xEnd;
        xStep = event.queryStringParameters.xStep ? event.queryStringParameters.xStep : xStep;
        nSeries = event.queryStringParameters.nSeries;
        // dump to console for debug/inspection
        console.log([xStart, xEnd, xStep, nSeries]);
    }

    const code = `
        var N_SERIES = 4;
        
        var radialBasisKernel = function(x, y) {
            return Math.exp(-0.5 * Math.pow(x - y, 2));
        }
        
        var applyKernelFunction = function(xa, xb, kernelFunction) {
            return mapN(function(y) { mapN(function(i) { return kernelFunction(xa[y], xb[i]); }, xb.length)}, xa.length)
        };
        
        var zeroVector = function(size) {
          return Vector(repeat(size, function(x) { return 0.0; }));
        }
        
        var xs = _.range(-4,4.1, 0.5);
        var covTensor = Matrix(applyKernelFunction(xs, xs, radialBasisKernel));
        var ys = repeat(N_SERIES, function(x) { return sample(MultivariateGaussian({mu: zeroVector(xs.length), cov: covTensor})); });
        
        // for each tensor get just the series data; for each series data (a dictionary index: value), get values
        // result is a list of list, each list is the y vals mapping to the xs specified
        var yVals = map(function(series) { return mapN(function(n) { return series[n]; }, Object.keys(series).length)}, map(function(series) { return series.data; }, ys));
        
        // finally, for each series print out the pairs x, y
        map(function(ySeries) { return mapN(function(n) { return {x: xs[n], y: ySeries[n]}; }, xs.length)}, yVals);`;

    // running webppl code
    webppl.run(code, (s, val) => {
        replyJson(callback, 200, { s, val });
    });

};

