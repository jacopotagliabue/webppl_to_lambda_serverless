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
            body {
                margin: 0;
                font-family: 'Consolas', 'Deja Vu Sans Mono', 'Bitstream Vera Sans Mono', monospace;
                font-size: 14px;
                padding: 20px;
            }
            #inputContainer {
                margin-bottom: 20px;
            }
            input {
                font-family: 'Consolas', 'Deja Vu Sans Mono', 'Bitstream Vera Sans Mono', monospace;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
      <h1>Gaussian Processes Vizualizer</h1>
      <div>
        <div id="inputContainer"></div>
        <input type="button" value="Probabilistic magic!" id="WebPPLBtn" />
      </div>
      <div id="graph-container"></div>
    </body>
    <script>
        
        // define input fields for the GP function with some default and description
        var INPUT_FIELDS = [
            {'input': 'xStart', 'default': -4, 'description': 'Start value for X-axis'},
            {'input': 'xEnd', 'default': 4.1, 'description': 'End value for X-axis'},
            {'input': 'xStep', 'default': 0.5, 'description': 'Step for the range xStart-xEnd'},
            {'input': 'nSeries', 'default': 4, 'description': 'Number of priors to sample'}
        ]
    
        // on doc ready, display input fields/labels
        $( document ).ready(function() {
            console.log( "ready!" );
            // loop over input fields value and display them
            $.each(INPUT_FIELDS, function(index, f) {
                var newEl = f['input'] + ' (i.e. ' + f['description'] + ')&nbsp;&nbsp;<input style="width:50px;" type="text" id="' + f['input']  + 'Txt" value="' + f['default'] + '" /><br/>';
                $("#inputContainer").append(newEl);
            });
        });
    
        // bind ajax call to on click event
        $("#WebPPLBtn" ).click(function() {
            
            // loop over input fields to get values for params
            var params = {}
            $.each(INPUT_FIELDS, function(index, f) {
                params[f['input']] =  parseFloat($("#" + f['input'] + "Txt").val());
            });
            
            console.log('Ajax params are: ' + JSON.stringify(params));
            
            // make ajax call to model API
            $.ajax({
              url: "/dev/model",
              type: "get", 
              data: params,
              dataType: 'json',
              // on success, draw data with chart.js
              success: function(data) {
                console.log("Data received: " + JSON.stringify(data));
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
              // if something is wrong, just print an alert
              error: function(err) { alert("Error: " + JSON.stringify(err)); }
            });  
        });
        
        // DISPLAY CHART CODE BELOW WITH SOME HELPER FUNCTIONS
        
        var randomIntInRange = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        
        var randomRGB = function() {
            return randomIntInRange(0, 256);
        };
        
        var drawLineChart = function(data) {
            $('#gpPriorsCanvas').remove();
            $('#graph-container').append('<canvas id="gpPriorsCanvas" height="405" width="720"><canvas>');
            var ctx = document.getElementById('gpPriorsCanvas').getContext('2d');
            // chart with chart.js
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

    // set some default values
    var xStart = -4;
    var xEnd = 4.1;
    var xStep = 0.5;
    var nSeries = 4; // we are just faking this to be compulsory


    // if no param at all or missing a mandatory one, throw error
    if (!event.queryStringParameters || !event.queryStringParameters.nSeries) {
        var errorMessage = "Mandatory parameters are missing! Query parameters received: " + event.queryStringParameter;

        // var error = new Error(errorMessage);
        // if you return this, the string gets logged to cloudwatch -> https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-mode-exceptions.html
        // callback(error);

        // wrap error in a nicer JSON format
        replyJson(callback, 503, {error: errorMessage});
    }
    else {
        // overwrite params if there
        xStart = event.queryStringParameters.xStart ? event.queryStringParameters.xStart : xStart;
        xEnd = event.queryStringParameters.xEnd ? event.queryStringParameters.xEnd : xEnd;
        xStep = event.queryStringParameters.xStep ? event.queryStringParameters.xStep : xStep;
        nSeries = parseInt(event.queryStringParameters.nSeries); // this NEEDS to be an int
        // dump to console for debug/inspection
        console.log([xStart, xEnd, xStep, nSeries]);
    }

    // the easiest way to pass parameters to the model is to declare a code snippet on top and use the variables
    // in the model accordingly
    var modelParams = `
        var N_SERIES = ${nSeries};
        var X_START = ${xStart};
        var X_END = ${xEnd};
        var X_STEP = ${xStep}; 
    `;

    // model params here
    console.log("Model params are: " + JSON.stringify(modelParams));

    const code = `
        // calculate RBF Kernel (a.k.a. exponentiated quadratic covariance function), assuming sigma=1
        var radialBasisKernel = function(x, y) {
            return Math.exp(-0.5 * Math.pow(x - y, 2));
        }
        
        // apply kernel function to tensors
        var applyKernelFunction = function(xa, xb, kernelFunction) {
            return mapN(function(y) { mapN(function(i) { return kernelFunction(xa[y], xb[i]); }, xb.length)}, xa.length)
        };
        
        // produce a vector of zeros for the given size
        var zeroVector = function(size) {
          return Vector(repeat(size, function(x) { return 0.0; }));
        }
        
        // we sample N_SERIES different function realisations from our GP with RBF Kernel
        // without any observed data
        var xs = _.range(X_START, X_END, X_STEP);
        var covTensor = Matrix(applyKernelFunction(xs, xs, radialBasisKernel));
        var ys = repeat(N_SERIES, function(x) { return sample(MultivariateGaussian({mu: zeroVector(xs.length), cov: covTensor})); });
        
        // for each tensor get just the series data; for each series data (a dictionary index: value), get values
        // result is a list of list, each list is the y vals mapping to the xs specified
        var yVals = map(function(series) { return mapN(function(n) { return series[n]; }, Object.keys(series).length)}, map(function(series) { return series.data; }, ys));
        
        // finally, for each series print out the pairs x, y
        map(function(ySeries) { return mapN(function(n) { return {x: xs[n], y: ySeries[n]}; }, xs.length)}, yVals);`;

    // running webppl code as the concatenation of model params + model code
    webppl.run(modelParams + code, (s, val) => {
        replyJson(callback, 200, { s, val });
    });

};

