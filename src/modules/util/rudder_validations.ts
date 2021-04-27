import { string as str } from 'yup';

const ALPHANUMERIC_WITH_HYPHEN = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;

function createHostNameValidator(length: number, msg: string) {
  const requiredHostName = str().trim().required('This field is required').concat(
    str()
      .max(length, `Maximum length of ${length} characters exceeded`)
      .matches(ALPHANUMERIC_WITH_HYPHEN, msg)
  );
  return function validateHostName(val: any) {
    try {
      requiredHostName.validateSync(val);
      return undefined;
    } catch (error) {
      throw new Error(error.errors[0]);
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
