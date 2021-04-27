import { string as str } from 'yup';

// TODO verify regex
// TODO show validation errors msgs

const ERROR_REQUIRED = 'This field is required'

const requiredString = str().trim().required(ERROR_REQUIRED);

const shouldntStartWithNumber = str()
  .trim()
  .matches(/^[^\d].*$/, 'Numbers not allowed for first character');
const noUpperCaseAllowed = str()
  .trim()
  .matches(/^([^A-Z])*$/, 'No uppercase letters allowed');
const alphaNumericDash50 = str()
  .trim()
  .required(ERROR_REQUIRED)
  .max(50, 'Maximum length of 50 characters exceeded')
  .matches(
    /^[a-zA-Z]([a-zA-Z0-9-_])*$/,
    'Must be valid alpha or numeric or dash(-_) characters'
  );
const maxLength50 = str().max(50, 'Maximum length of 50 characters exceeded');

const ALPHANUMERIC_WITH_HYPHEN = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;

function createHostNameValidator(length: number, msg: string) {
  const requiredHostName = requiredString.concat(
    str()
      .max(length, `Maximum length of ${length} characters exceeded`)
      .matches(ALPHANUMERIC_WITH_HYPHEN, msg)
  );
  return function validateHostName(val: any) {
    try {
      requiredHostName.validateSync(val);
      return undefined;
    } catch (error) {
      return error.errors;
    }
  };
}

export const validateNamespace = createHostNameValidator(
  50,
  'Must be a valid namespace'
);
export const validateContainerName = createHostNameValidator(
  50,
  'Must be a valid container name'
);
export const validateEnvName = createHostNameValidator(
  50,
  'Must be a valid name'
);
export const validateK8name50 = createHostNameValidator(
  50,
  'Must be a valid kubernetes name'
);
export const validateK8name20 = createHostNameValidator(
  20,
  'Must be a valid kubernetes name'
);
export const validateRudderName50 = createHostNameValidator(
  50,
  'Must be a valid name'
);
export const validateAppName50 = createHostNameValidator(
  50,
  'Must be a valid name'
);

export const validateVolumeName = createHostNameValidator(
  50,
  'Must be a valid name'
);

const imageNameWithTag = requiredString;

export function validateImageNameWithTag(val: any) {
  try {
    imageNameWithTag.validateSync(val);
    return undefined;
  } catch (error) {
    return error.errors;
  }
}
