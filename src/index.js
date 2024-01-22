/* global Cypress, cy */
const axios = require('axios');
const {
    REPORTING_TEST_STATUS,
    LAB_EXECUTION_REPORT_URL,
    MOCHA_STATUS,
    REPORTING_COMMAND_STATUS
} = require('./consts');
const commandHandler = require('./command-handler');

let testStartTime = 0;

const ignoreReporterErrors = () => {/* do nothing this is not relevant to the execution */
};

const getFiledRecursively = (field, data, delimiter = ' - ') => {
    if (!data.parent) return data[field];
    let parentsValue = getFiledRecursively(field, data.parent, delimiter);

    return (parentsValue ? parentsValue + delimiter : '') + data[field];
};

const getSpecFile = () => Cypress.spec && Cypress.spec.relative;

const getCustomFields = () => {
    const customFields = [];

    let specFile = getSpecFile();

    if (specFile) {
        customFields.push({name: 'SpecFile', value: specFile})
    }

    if (Cypress.version) {
        customFields.push({name: 'CypressVersion', value: Cypress.version})
    }

    return customFields;
};

const isFailed = (test) => {
    return test.state === MOCHA_STATUS.FAILED;
};

Cypress.on('script:error', function (err) {
    return axios.post(
        LAB_EXECUTION_REPORT_URL + '/execution-data/',
        {
            ...err && err.error && {failedMsg: err.error}
        }
    );
});

Cypress.on('test:after:run', (test, runner) => {
    let isTestFailed = isFailed(test);
    const status = isTestFailed ? REPORTING_TEST_STATUS.FAILED : REPORTING_TEST_STATUS.PASSED;
    const message = isTestFailed ? test.err.stack : '';

    const testEndTime = new Date().getTime();
    return axios.post(
        LAB_EXECUTION_REPORT_URL + '/test-end/',
        {
            status,
            message,
            name: getFiledRecursively('title', runner),
            specFile: getSpecFile(),
            endTime: testEndTime,
            duration: testEndTime - testStartTime
        }
    ).catch(ignoreReporterErrors);
});

Cypress.on('test:before:run', async (_test, runner) => {
    testStartTime = new Date().getTime();
    let failedCommand;

    cy.on('fail', (error) => {
        if (failedCommand) {
            axios.post(
                LAB_EXECUTION_REPORT_URL + '/command/',
                commandHandler.getCommandParams(failedCommand, REPORTING_COMMAND_STATUS.FAILURE)
            ).catch(ignoreReporterErrors);
        }
        throw error;
    });

    cy.on('command:start', (command) => {
        command.startTime = new Date().getTime();
        failedCommand = command;
    });

    cy.on('command:end', (command) => {
        axios.post(
            LAB_EXECUTION_REPORT_URL + '/command/',
            commandHandler.getCommandParams(command)
        ).catch(ignoreReporterErrors);
        // TODO: (Elhay) try  to report from here about failed command if  we have the status
    });

    return axios.post(LAB_EXECUTION_REPORT_URL + '/test-start', {
        name: getFiledRecursively('title', runner),
        startTime: testStartTime,
        specFile: getSpecFile(),
        context: {customFields: [...getCustomFields()]}
    }).catch(ignoreReporterErrors);
});
