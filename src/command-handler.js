const {REPORTING_COMMAND_STATUS} = require('./consts');

const parseCommand = (command) => {
  const logs = command.attributes.logs;
  if (!logs || !logs[0] || !logs[0].toJSON && typeof logs[0].toJSON !== 'function') {
    return;
  }

  return logs[0].toJSON();
};

const safeStringify = (obj, indent = 2) => {
  let cache = [];
  let retVal;
  try {
    retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
  } catch (e) {}
  cache = null;
  return retVal;
};

const dataToString = (data) => typeof data === 'object' ? safeStringify(data, 2) : data;

const consolePropsToParameters = (command) => {
  const parsedCommand = parseCommand(command);

  if (!parsedCommand || !parsedCommand.consoleProps || !Object.keys(parsedCommand.consoleProps).length) {
    return;
  }

  return Object.entries(parsedCommand.consoleProps).map(([name, value]) => ({name, value: dataToString(value)}));
};

const attributesPropsToParameters = (command) => {
  return command.attributes.args.map((arg, index) => ({name: 'param-' + index, value: dataToString(arg)}));
};

const getParameters = (command) => {
  return consolePropsToParameters(command) || attributesPropsToParameters(command);
};

const getCommandParams = (command, status = REPORTING_COMMAND_STATUS.SUCCESS) => {
  const screenshots = [];
  let parsedCommand = parseCommand(command) || {
    message: dataToString(command.attributes.args[0])
  };

  if (command.attributes.name === 'screenshot') {
    screenshots.push(parsedCommand.consoleProps.path);
  }

  // TODO: (NP-44689) on writeFile command add it to test artifacts
  return {
    status,
    startTime: command.startTime,
    endTime: new Date().getTime(),
    name: command.attributes.name,
    message: parsedCommand.message,
    commandType: 'DEFAULT', // TODO: (NP-44698) use also ASSERTION
    parameters: getParameters(command),
    screenshots,
    // expectedData, // TODO: (NP-44699) support expectedData type IMAGE_KEY
    // resultData
  };
}

module.exports = {
  getCommandParams: getCommandParams
};
