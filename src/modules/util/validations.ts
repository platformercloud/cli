import { getOrganizationIdByName } from '../auth/organization';
import { getProjectIdByName } from '../auth/project';
import ValidationError from '../errors/validation-error';
import { getEnvironmentIdByName } from '../apps/environment';

export async function tryValidateFlags(flags: {
  organization: {
    name: string;
    required: boolean;
  };
  project?: {
    name: string;
    required: boolean;
  };
  environment?: {
    name: string;
    required: boolean;
  };
}) {
  const { organization, project, environment } = flags;

  if (organization.required && !organization.name) {
    throw new ValidationError('Organization not set', {
      suggestions: [
        'Pass the organization name with the --organization flag',
        'Set the default organization with $ platformer select:organization',
      ],
    });
  }
  if (project?.required && !(project?.name && organization.name)) {
    throw new ValidationError('Project not set', {
      suggestions: [
        'Pass the project name with the --project flag',
        'Set the default project with $ platformer select:project',
      ],
    });
  }
  if (
    environment?.required &&
    !(project?.name && organization.name && environment?.name)
  ) {
    throw new ValidationError('Environment not set', {
      suggestions: [
        'Pass the environment name with the --environment flag',
        'Set the default environment with $ platformer select:environment',
      ],
    });
  }

  let orgId, projectId, envId;
  orgId = (await getOrganizationIdByName(organization.name))?.organization_id;
  if (!orgId) {
    throw new ValidationError(`Invalid Organization [${organization.name}]`);
  }

  if (!project?.name) {
    return { orgId };
  }

  projectId = (await getProjectIdByName(orgId, project?.name))?.project_id;
  if (!projectId) {
    throw new ValidationError(`Invalid Project [${project?.name}]`);
  }

  if (!environment?.name) {
    return { orgId, projectId };
  }

  envId = (await getEnvironmentIdByName(orgId, projectId, environment?.name))
    ?.ID;
  if (!envId) {
    throw new ValidationError(`Invalid Environment [${environment?.name}]`);
  }

  return {
    orgId,
    projectId,
    envId,
  };
}
