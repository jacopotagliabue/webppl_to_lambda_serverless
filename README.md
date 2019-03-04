# Serving webppl models with an (AWS Lambda-powered) endpoint

## Overview
This repo is a WIP: the goal is to share some elementary working code 
running a probabilistic [WebPPL](http://webppl.org/) program in AWS Lambda and display 
some nice charts as a result with the help of libraries like
[JQuery](https://jquery.com/) and [ChartJS](https://www.chartjs.org/).

Please refer to the original blog post for context and details on the project structure.

## App structure
TBC

## Deploy with serverless 
It's assumed you have `npm` and `Serverless` up and running (see [here](https://serverless.com/)). Then:

* clone the project;
* `cd` into the folder; 
* install [dependencies](https://aws.amazon.com/it/premiumsupport/knowledge-center/lambda-deployment-package-nodejs/) for our lambda with `npm install webppl`;
* finally, type `serverless deploy` to deploy the project to AWS.

## License
All the code in this repo is provided "AS IS" and it is freely available under the [Apache License Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).