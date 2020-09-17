/* global Cypress, cy */
const axios = require('axios');
const {
  REPORTING_TEST_STATUS,
  LAB_EXECUTION_REPORT_URL,
  MOCHA_STATUS,
  REPORTING_COMMAND_STATUS
} = require('./consts');
const commandHandler = require('./command-handler');

const ignoreReporterErrors = () => {/* do nothing this is not relevant to the execution */};

const getFiledRecursively = (field, data, delimiter = ' - ') => {
  if (!data.parent) return data[field];
  let parentsValue = getFiledRecursively(field, data.parent, delimiter);

  return (parentsValue ? parentsValue + delimiter : '') + data[field];
};

const getCustomFields = () => {
  const customFields = [];

  if (Cypress.spec && Cypress.spec.relative) {
    customFields.push({name: 'SpecFile', value: Cypress.spec.relative})
  }

  if (Cypress.version) {
    customFields.push({name: 'CypressVersion', value: Cypress.version})
  }

  return customFields;
};

const isFailed = (test) => {
  return test.state === MOCHA_STATUS.FAILED;
};

Cypress.on('test:before:run:async', function (_test, runner) {
  let failedCommand;
  let reportingTestId = '';

  cy.once('test:after:run', (test) => {
    let isTestFailed = isFailed(test);
    const status = isTestFailed ? REPORTING_TEST_STATUS.FAILED : REPORTING_TEST_STATUS.PASSED;
    const message = isTestFailed ? test.err.stack : '';

    return axios.post(
      LAB_EXECUTION_REPORT_URL + '/test-end/' + reportingTestId,
      { status, message, endTime: new Date().getTime() }
    ).catch(ignoreReporterErrors);
  });

  cy.on('fail', (error) => {
    axios.post(
      LAB_EXECUTION_REPORT_URL + '/command/' + reportingTestId,
      commandHandler.getCommandParams(failedCommand, REPORTING_COMMAND_STATUS.FAILURE)
    ).catch(ignoreReporterErrors);
    throw error;
  });

  cy.on('command:start', (command) => {
    command.startTime = new Date().getTime();
    failedCommand = command;
  });

  cy.on('command:end', (command) => {
    axios.post(
      LAB_EXECUTION_REPORT_URL + '/command/' + reportingTestId,
      commandHandler.getCommandParams(command)
    ).catch(ignoreReporterErrors);
  });

  return axios.post(LAB_EXECUTION_REPORT_URL + '/test-start', {
    name: getFiledRecursively('title', runner),
    startTime: new Date().getTime(),
    context: { customFields: [...getCustomFields()] }
  })
    .then(({data}) => {
      reportingTestId = data.testId;
      cy.addAlias(runner.ctx, {
        subject: reportingTestId,
        alias: 'failedScreenshotDetails'
      });
    })
    .catch(ignoreReporterErrors);
});
