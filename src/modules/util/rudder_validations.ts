import { string as str } from 'yup';

const ALPHANUMERIC_WITH_HYPHEN = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;

function createHostNameValidator(length: number, msg: string) {
  const requiredHostName = str().trim().concat(
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

export const validateContainerName = createHostNameValidator(
  50,
  'Must be a valid container name'
);
export const validateAppName50 = createHostNameValidator(
  50,
  'Must be a valid name'
);
