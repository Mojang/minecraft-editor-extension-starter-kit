/*
    Helper functions to extract variables from the .env file and inject them
    into the compilation and configuration process
*/

import path from "path";
require("dotenv").config();

export function expandVariablesWithEnvironmentVariables(inputString) {
  // find/replace all expandable variables '{var-name}' and replace them
  // with the ones defined in the .env file
  const variableRegExp = /{(.+)}/g;
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

export function getExtensionName() {
  const extensionName = process.env.MC_EXTENSION_NAME;
  if (!extensionName) {
    throw "Unable to resolve Extension Name from .env file";
  }
  return extensionName;
}

export function getBehaviorPackName() {
  const packName = process.env.MC_BEHAVIOR_PACK_NAME;
  if (!packName) {
    throw "Unable to resolve Behavior Pack Name from .env file";
  }
  return packName;
}

export function getTargetDir(exePrefix, extensionName) {
  var outputDir = process.env["MC_PACK_ROOT_" + exePrefix];
  if (!outputDir) {
    throw "Unable to resolve " + exePrefix + " output path from .env file";
  }

  // Expand any environment variables
  outputDir = expandVariablesWithEnvironmentVariables(outputDir);

  // Append the extension name and the output directory within
  outputDir = path.resolve(outputDir, extensionName);
  return outputDir;
}
