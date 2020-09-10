/* global Cypress, cy */
const axios = require('axios');

const LAB_EXECUTION_REPORT_URL = 'http://localhost:3009/report';

const getFiledRecursively = (field, data, delimiter = ' - ') => {
  if (!data.parent) return data[field];
  let parentsValue = getFiledRecursively(field, data.parent, delimiter);

  return (parentsValue ? parentsValue + delimiter : '') + data[field];
};

Cypress.on('test:before:run', async function (test) {
  const startTime = new Date().getTime();
  const title = getFiledRecursively('title', test);
  let reportingTestId = '';

  cy.once('test:after:run', function (test) {
    const status = test.state === 'passed' ? 'PASSED' : 'FAILED';
    const message = status === 'FAILED' ? test.err.stack : '';

    console.log('test', test);
    return axios.post(LAB_EXECUTION_REPORT_URL + '/test-end/' + reportingTestId, {
      status,
      endTime: new Date().getTime(),
      message
    })
      .catch(() => {});
  });

  await axios.post(LAB_EXECUTION_REPORT_URL + '/test-start', {
    name: title,
    startTime,
    context: {
      customFields: [{name: 'specFile', value: test.invocationDetails.relativeFile}]
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
