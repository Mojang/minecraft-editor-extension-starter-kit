/*
    Helper functions to extract variables from the .env file and inject them
    into the compilation and configuration process
*/

import path from "path";
require("dotenv").config();

export function expandVariablesWithEnvironmentVariables(inputString) {
  // find/replace all expandable variables '{VAR_NAME}' and replace them
  // with the ones defined in the .env file
  const variableRegExp = /{([A-Z|_|0-9]+)}/g;
  var match = variableRegExp.exec(inputString);
  if (!match) {
    throw "The input string did not have any expansion variables";
  }
  while (match) {
    if (match.length >= 1) {
      const unresolvedEnvVar = match[1];
      const resolvedEnvVar = process.env[unresolvedEnvVar];
      if (resolvedEnvVar) {
        inputString = inputString.replace(match[0], resolvedEnvVar);
      } else {
        throw (
          "Unable to resolve environment variable [" +
          unresolvedEnvVar +
          "] in input string [" +
          inputString +
          "]"
        );
      }
    }
    match = variableRegExp.exec(inputString);
  }

  return inputString;
}

export function shouldGenerateResourcePack() {
  var requirement = process.env.MC_EXTENSION_GENERATE_RESOURCE_PACK;
  if(!requirement) {
    return false;
  }
  requirement = requirement.toLowerCase();
  if(requirement === 'yes' || requirement === '1' || requirement === 'true') {
    return true;
  }
  else if( requirement === 'no' || requirement === '0' || requirement === 'false') {
    return false;
  }
  throw 'MC_EXTENSION_GENERATE_RESOURCE_PACK in .env is set to an invalid value [' + requirement + ']';
}

export function getExtensionName() {
  const extensionName = process.env.MC_EXTENSION_NAME;
  if (!extensionName) {
    throw "Unable to resolve Extension Name from .env file";
  }
  return extensionName;
}

export function getBehaviorPackName() {
  const packName = process.env.MC_PACK_NAME;
  if (!packName) {
    throw "Unable to resolve Behavior Pack Name from .env file";
  }
  return packName;
}

export function getResourcePackName() {
  const packName = process.env.MC_PACK_NAME;
  if (!packName) {
    throw "Unable to resolve Resource Pack Name from .env file";
  }
  return packName;
}

export function getBehaviorPackFolder(exePrefix) {
  const behaviorPackName = getBehaviorPackName();
  const rootFolder = getTargetFolder(exePrefix);
  const outputDir = path.resolve(rootFolder, 'development_behavior_packs', behaviorPackName);
  return outputDir;
}

export function getResourcePackFolder(exePrefix) {
  const resourcePackName = getResourcePackName();
  const rootFolder = getTargetFolder(exePrefix);
  const outputDir = path.resolve(rootFolder, 'development_resource_packs', resourcePackName);
  return outputDir;
}

export function getResourcePackUUID() {
  const uuid = process.env.MC_RESOURCE_PACK_UUID;
  if(!uuid) {
    throw 'Unable to resolve resource pack uuid from .env file';
  }
  return uuid;
}

export function getTargetFolder(exePrefix) {
  var outputDir = process.env["MC_PACK_ROOT_" + exePrefix];
  if (!outputDir) {
    throw "Unable to resolve MC_PACK_ROOT_" + exePrefix + " output path from .env file";
  }

  // Expand any environment variables
  outputDir = expandVariablesWithEnvironmentVariables(outputDir);
  return outputDir;
}
