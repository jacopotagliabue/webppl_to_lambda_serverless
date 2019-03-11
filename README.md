# Serving webppl models with an (AWS Lambda-powered) endpoint

## Overview
The repo contains the code for our [Medium](https://medium.com/tooso) post ["Build smart(er) applications with probabilistic models and AWS Lambda functions"](https://medium.com/p/build-smart-er-applications-with-probabilistic-models-and-aws-lambda-functions-da982d69cab1?source=email-bffd30619c10--writer.postDistributed&sk=fba1d20f1fe33c1499f7b2016187e793): 
the goal is to share some elementary working code running a probabilistic [WebPPL](http://webppl.org/) program in AWS Lambda and display 
some nice charts as a result with the help of libraries like
[JQuery](https://jquery.com/) and [ChartJS](https://www.chartjs.org/).

Please refer to the original blog post for context and details on the project structure.

## App structure
The app structure depends on two key files:

* `handler.js`, which contains the two main functions, one generating a web app, the other running the probabilistic model;
* `serverless.yml`, which contains the definition of the AWS infrastructure that will run the functions when triggered through API gateway.

Please refer to the original [blog post](https://medium.com/p/build-smart-er-applications-with-probabilistic-models-and-aws-lambda-functions-da982d69cab1?source=email-bffd30619c10--writer.postDistributed&sk=fba1d20f1fe33c1499f7b2016187e793) for details.

## Deploy with serverless 
It's assumed you have `npm` and `Serverless` up and running (see [here](https://serverless.com/)). Then:

* clone the project;
* `cd` into the folder; 
* install [dependencies](https://aws.amazon.com/it/premiumsupport/knowledge-center/lambda-deployment-package-nodejs/) for our lambda with `npm install webppl`;
* finally, type `serverless deploy` to deploy the project to AWS.

## License
All the code in this repo is provided "AS IS" and it is freely available under the [Apache License Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
