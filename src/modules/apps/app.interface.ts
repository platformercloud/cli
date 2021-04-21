export const K8_HPA = 'HorizontalPodAutoscaler';
export const K8_Deployment = 'Deployment';
export const K8_Service = 'Service';
export const K8_Ingress = 'Ingress';
export const K8_PVC = 'PersistentVolumeClaim';
export const K8_Pod = 'Pod';
export const K8_ConfigMap = 'ConfigMap';
export const K8_Secret = 'Secret';
export const K8_CronJob = 'CronJob';
export const K8_Job = 'Job';
export const K8_StatefulSet = 'StatefulSet';
export const K8_VPA = 'VerticalPodAutoscaler';

export const appTypes = [
  K8_Deployment,
  K8_Job,
  K8_CronJob,
  K8_StatefulSet,
] as const;
export type ApplicationType = typeof appTypes[number];

export type UserId = string;
export type OrgId = string;
export type ProjectId = string;

export type AppEnvServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer' | '';

export interface AppEnvironment {
  ID: string;
  metadata: Record<string, string> | null;
  CreatedAt: string;
  DeletedAt: string | null;
  UpdatedAt: string;
  environment_id: string;
  environment: null;
  app_id: string;
  app: null;
  containers: null;
  latest_deployment: {
    deployment_history_id: string;
    deployment_history: null;
    pending: false;
  };
  kubernetes_name: string;
  replicas: number;
  graceful_termination_seconds: number;
  service_account_name: string;
  node_selector: Record<string, string> | null;
  hash: string;
  cronjob_frequency: string;
  auto_deploy: boolean;
  /**
   * selected namespace name
   */
  namespace: string;
  service_type: AppEnvServiceType;
}

export interface Application {
  ID: string;
  name: string;
  organization_id: OrgId;
  project_id: ProjectId;
  type: ApplicationType;
  app_environments: AppEnvironment[] | null;
  metadata: Record<string, string> | null;
  CreatedAt: string;
  DeletedAt: string | null;
  UpdatedAt: string;
}
