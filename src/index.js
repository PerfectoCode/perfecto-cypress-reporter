/* global Cypress, cy */
const axios = require('axios');

const LAB_EXECUTION_REPORT_URL = 'http://localhost:3009/report';

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

Cypress.on('test:before:run', function (_test, runner) {
  const startTime = new Date().getTime();
  const title = getFiledRecursively('title', runner);
  let reportingTestId = '';

  cy.once('test:after:run', function (test) {
    const status = test.state === 'passed' ? 'PASSED' : 'FAILED';
    const message = status === 'FAILED' ? test.err.stack : '';

    return axios.post(LAB_EXECUTION_REPORT_URL + '/test-end/' + reportingTestId, {
      status,
      endTime: new Date().getTime(),
      message
    })
      .catch(() => {});
  });

  axios.post(LAB_EXECUTION_REPORT_URL + '/test-start', {
    name: title,
    startTime,
    context: {
      customFields: [...getCustomFields()]
    }
  })
    .then(({data}) => reportingTestId = data.testId)
    .catch(() => {/* do nothing this is not relevant to the execution */});
});

Cypress.on('command:start', (command) => {
  console.log('[perfecto-Cypress] command:start', command);
})
Cypress.on('command:end', function (/* command */) {
  // console.log('[perfecto-Cypress] command:end:run', command);
})
