# perfecto-cypress-reporter
Perfecto reporter for Cypress automation tests framework

⚠️ There is no point to use this file outside [Perfecto-Cypress execution](https://www.npmjs.com/package/perfecto-cypress-sdk).
(It won't throw an exception, but it also does nothing, in this case)

## What is this?
This code will listen to Cypress events such as commands test-start and test-end.
From the data that collected it will create rest execution report with video screenshots and commands.

## Installation
Add this package as dependency in the root of your Cypress tests code
```shell
 npm i perfecto-cypress-reporter
 ```

## Usage
1. Go to `cypress/support/index.js` or (if you customized `supportFile` value, follow it location).
2. Import this package: 
```
import 'perfecto-cypress-reporter';
``` 
Or 
```
require('perfecto-cypress-reporter');
```
