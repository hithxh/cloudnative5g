//=======================================================================
// Copyright (c) 2017-2020 Aarna Networks, Inc.
// All rights reserved.
// ======================================================================
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//           http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========================================================================
import axios from "axios";
axios.defaults.baseURL = process.env.REACT_APP_BACKEND || "";
//orchestrator
//projects
const createProject = (request) => {
  return axios.post("/v2/projects", { ...request }).then((res) => res.data);
};
const updateProject = (request) => {
  return axios
    .put(`/v2/projects/${request.metadata.name}`, { ...request })
    .then((res) => res.data);
};
const deleteProject = (projectName) => {
  return axios.delete(`/v2/projects/${projectName}`).then((res) => res.data);
};
const getProjectDetails = (projectName) => {
  return axios.get(`/v2/projects/${projectName}`).then((res) => res.data);
};
const getAllProjects = () => {
  return axios.get("/v2/projects").then((response) => {
    return response.data;
  });
};

//composite apps
const getCompositeApps = (request) => {
  return axios
    .get(`/v2/projects/${request.projectName}/composite-apps`)
    .then((res) => {
      return res.data;
    });
};

const createCompositeApp = ({ projectName, ...request }) => {
  return axios
    .post(`/v2/projects/${projectName}/composite-apps`, request.payload)
    .then((res) => {
      return res.data;
    });
};
const updateCompositeApp = (request) => {
  return axios
    .put(
      `/v2/projects/${request.projectName}/composite-apps/${request.payload.name}/${request.compositeAppVersion}`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};

//apps
const getApps = (request) => {
  return axios
    .get(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/apps`
    )
    .then((res) => {
      return res.data;
    });
};
const addApp = (request) => {
  return axios
    .post(
      `/v2/projects/${request.get("projectName")}/composite-apps/${request.get(
        "compositeAppName"
      )}/${request.get("compositeAppVersion")}/apps`,
      request
    )
    .then((res) => {
      return res.data;
    });
};
const updateApp = (request) => {
  return axios
    .put(
      `/v2/projects/${request.get("projectName")}/composite-apps/${request.get(
        "compositeAppName"
      )}/${request.get("compositeAppVersion")}/apps/${request.get("appName")}`,
      request
    )
    .then((res) => {
      return res.data;
    });
};
const deleteApp = (request) => {
  return axios
    .delete(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/apps/${request.appName}`
    )
    .then((res) => {
      return res.data;
    });
};

//profiles
const createCompositeProfile = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/composite-profiles`,
      request.payload
    )
    .then((res) => res.data);
};
const getCompositeProfiles = (request) => {
  return axios
    .get(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/composite-profiles`
    )
    .then((res) => res.data);
};
const deleteCompositeProfile = (request) => {
  return axios
    .delete(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/composite-profiles/${request.compositeProfileName}`
    )
    .then((res) => res.data);
};
const addProfile = (request) => {
  return axios
    .post(
      `/v2/projects/${request.get("projectName")}/composite-apps/${request.get(
        "compositeAppName"
      )}/${request.get("compositeAppVersion")}/composite-profiles/${request.get(
        "compositeProfileName"
      )}/profiles`,
      request
    )
    .then((res) => {
      return res.data;
    });
};
const getProfiles = (request) => {
  return axios
    .get(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/composite-profiles/${request.compositeProfileName}/profiles`
    )
    .then((res) => res.data);
};
const deleteProfile = (request) => {
  return axios
    .delete(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/composite-profiles/${request.compositeProfileName}/profiles/${request.profileName}`
    )
    .then((res) => res.data);
};

//placement intents
const getGenericPlacementIntents = (request) => {
  return axios
    .get(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/generic-placement-intents`
    )
    .then((res) => res.data);
};
const createGenericPlacementIntent = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/generic-placement-intents`,
      request.payload
    )
    .then((res) => res.data);
};
const deleteGenericPlacementIntent = (request) => {
  return axios
    .delete(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/generic-placement-intents/${request.genericPlacementIntentName}`
    )
    .then((res) => res.data);
};
const getAppPlacementIntents = (request) => {
  return axios
    .get(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/generic-placement-intents/${request.genericPlacementIntentName}/app-intents`
    )
    .then((res) => res.data);
};
const addAppPlacementIntent = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/generic-placement-intents/${request.genericPlacementIntentName}/app-intents`,
      request.payload
    )
    .then((res) => res.data);
};
const deleteAppPlacementIntent = (request) => {
  return axios
    .delete(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/generic-placement-intents/${request.genericPlacementIntentName}/app-intents/${request.appPlacementIntentName}`
    )
    .then((res) => res.data);
};

//network intents
const getNetworkControllerIntents = (request) => {
  return axios
    .get(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent`
    )
    .then((res) => {
      return res.data;
    });
};
const addNetworkControllerIntent = (request) => {
  return axios
    .post(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const deleteNetworkControllerIntent = (request) => {
  return axios
    .delete(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}`
    )
    .then((res) => {
      return res.data;
    });
};
const getWorkloadIntents = (request) => {
  return axios
    .get(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}/workload-intents`
    )
    .then((res) => {
      return res.data;
    });
};
const addWorkloadIntent = (request) => {
  return axios
    .post(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}/workload-intents`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const deleteWorkloadIntent = (request) => {
  return axios
    .delete(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}/workload-intents/${request.workloadIntentName}`
    )
    .then((res) => {
      return res.data;
    });
};
const getInterfaces = (request) => {
  return axios
    .get(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}/workload-intents/${request.workloadIntentName}/interfaces`
    )
    .then((res) => {
      return res.data;
    });
};
const addInterface = (request) => {
  return axios
    .post(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}/workload-intents/${request.workloadIntentName}/interfaces`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const deleteInterface = (request) => {
  return axios
    .delete(
      `/v2/ovnaction/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/network-controller-intent/${request.networkControllerIntentName}/workload-intents/${request.workloadIntentName}/interfaces/${request.interfaceName}`
    )
    .then((res) => {
      return res.data;
    });
};

//deployment intent group
const addIntentsToDeploymentIntentGroup = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/intents`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const editDeploymentIntentGroup = (request) => {
  return axios
    .put(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const getDeploymentIntentGroupIntents = (request) => {
  return axios
    .get(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/intents`
    )
    .then((res) => {
      return res.data;
    });
};
const approveDeploymentIntentGroup = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/approve`
    )
    .then((res) => {
      return res.data;
    });
};
const instantiate = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/instantiate`
    )
    .then((res) => {
      return res.data;
    });
};

const terminateDeploymentIntentGroup = (request) => {
  return axios
    .post(
      `/v2/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/terminate`
    )
    .then((res) => res.data);
};
//cluster-clm
const getClusterProviders = () => {
  return axios.get("/v2/cluster-providers").then((res) => {
    return res.data;
  });
};
const getClusterProvider = (providerName) => {
  return axios.get(`/v2/cluster-providers/${providerName}`).then((res) => {
    return res.data;
  });
};
const getClusters = (providerName) => {
  return axios
    .get(`/v2/cluster-providers/${providerName}/clusters`)
    .then((res) => {
      return res.data;
    });
};

const getClustersByLabel = (providerName, label) => {
  return axios
    .get(`/v2/cluster-providers/${providerName}/clusters`, {
      params: { label: `${label}` },
    })
    .then((res) => {
      return res.data;
    });
};
const registerClusterProvider = (request) => {
  return axios.post(`/v2/cluster-providers`, { ...request }).then((res) => {
    return res.data;
  });
};
const deleteClusterProvider = (providerName) => {
  return axios.delete(`/v2/cluster-providers/${providerName}`).then((res) => {
    return res.data;
  });
};
const updateClusterProvider = (request) => {
  return axios
    .put(`/v2/cluster-providers/${request.providerName}`, request.payload)
    .then((res) => {
      return res.data;
    });
};
const updateCluster = (request) => {
  return axios
    .put(
      `/v2/cluster-providers/${request.get("providerName")}/clusters/${
        JSON.parse(request.get("metadata")).metadata.name
      }`,
      request
    )
    .then((res) => {
      return res.data;
    });
};
const addClusterLabel = (request) => {
  return axios
    .post(
      `/v2/cluster-providers/${request.providerName}/clusters/${request.clusterName}/labels`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const getClusterLabels = (request) => {
  return axios
    .get(
      `/v2/cluster-providers/${request.providerName}/clusters/${request.clusterName}/labels`
    )
    .then((res) => {
      return res.data;
    });
};

const deleteClusterLabel = (request) => {
  return axios
    .delete(
      `/v2/cluster-providers/${request.providerName}/clusters/${request.clusterName}/labels/${request.labelName}`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const deleteCluster = (request) => {
  return axios
    .delete(
      `/v2/cluster-providers/${request.providerName}/clusters/${request.clusterName}`
    )
    .then((res) => {
      return res.data;
    });
};

//network-ncm
const getClusterProviderNetworks = (request) => {
  return axios
    .get(
      `/v2/ncm/${request.providerName}/clusters/${request.clusterName}/provider-networks`
    )
    .then((res) => {
      return res.data;
    });
};

const getClusterNetworks = (request) => {
  return axios
    .get(
      `/v2/ncm/${request.providerName}/clusters/${request.clusterName}/networks`
    )
    .then((res) => {
      return res.data;
    });
};

const addNetwork = (request) => {
  return axios
    .post(
      `/v2/ncm/${request.providerName}/clusters/${request.clusterName}/${request.networkType}`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};

const deleteClusterNetwork = (request) => {
  return axios
    .delete(
      `/v2/ncm/${request.providerName}/clusters/${request.clusterName}/${request.networkType}/${request.networkName}`
    )
    .then((res) => {
      return res.data;
    });
};
const applyNetworkConfig = (request) => {
  return axios
    .post(
      `/v2/ncm/${request.providerName}/clusters/${request.clusterName}/apply`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};
const terminateNetworkConfig = (request) => {
  return axios
    .post(
      `/v2/ncm/${request.providerName}/clusters/${request.clusterName}/terminate`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};

//controller
const getControllers = () => {
  return axios.get(`/v2/controllers`).then((res) => {
    return res.data;
  });
};

const addController = (request) => {
  return axios.post(`/v2/controllers`, request).then((res) => {
    return res.data;
  });
};

const updateController = (request) => {
  return axios.put(`/v2/controllers`, request).then((res) => {
    return res.data;
  });
};

const removeController = (controllerName) => {
  return axios.delete(`/v2/controllers/${controllerName}`).then((res) => {
    return res.data;
  });
};

//config servce
const getBlueprintConfig = () => {
  return axios.get(`/configsvc/getWorkflows`).then((res) => {
    return res.data;
  });
};

const getAppBlueprintConfig = (request) => {
  let req = `/configsvc/${request.compositeAppName}/${request.compositeAppVersion}/${request.appName}/bp`;
  if (request.type) req = req + `?type=${request.type}`;
  return axios.get(req).then((res) => {
    return res.data;
  });
};

const executeWorkflow = ({ type, ...request }) => {
  let req = {
    method: "get",
    url: `/configsvc/${request.blueprintName}/${request.blueprintVersion}/${request.actionName}`,
  };
  if (request.payload) {
    req.data = request.payload;
    req.method = "post";
  }
  if (type && type === "DELETE") req.method = "delete";
  return axios(req).then((res) => {
    return res.data;
  });
};

//DCM
const getLogicalClouds = (projectName) => {
  return axios
    .get(`/v2/dcm/projects/${projectName}/logical-clouds`)
    .then((res) => res.data);
};

const getLogicalCloudClusterReferences = (request) => {
  return axios
    .get(
      `/v2/dcm/projects/${request.projectName}/logical-clouds/${request.logicalCloudName}/cluster-references`
    )
    .then((res) => res.data);
};

const terminateLogicalCloud = (request) => {
  return axios
    .post(
      `/v2/dcm/projects/${request.projectName}/logical-clouds/${request.logicalCloudName}/terminate`
    )
    .then((res) => res.data);
};

const deleteLogicalCloudClusterReference = (request) => {
  return axios
    .delete(
      `/v2/dcm/projects/${request.projectName}/logical-clouds/${request.logicalCloudName}/cluster-references/${request.clusterReferenceName}`
    )
    .then((res) => res.data);
};

const deleteLogicalCloud = (request) => {
  let deleteUrl = `/v2/dcm/projects/${request.projectName}/logical-clouds/${request.logicalCloudName}`;
  return axios.delete(deleteUrl);
};

//middleend
const addCluster = (request) => {
  return axios
    .post(
      `/middleend/cluster-providers/${request.get("providerName")}/clusters`,
      request
    )
    .then((res) => {
      return res.data;
    });
};

const addService = ({ projectName, ...request }) => {
  return axios
    .post(`/middleend/projects/${projectName}/composite-apps`, request.payload)
    .then((res) => {
      return res.data;
    });
};

const deleteCompositeApp = (request) => {
  return axios
    .delete(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}`
    )
    .then((res) => {
      return res.data;
    });
};

const checkoutService = (request) => {
  var req = `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/checkout`;
  return axios.post(req).then((res) => {
    return res.data;
  });
};

const checkInService = (request) => {
  var req = `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/update`;
  return axios.post(req).then((res) => {
    return res.data;
  });
};

const getAllCompositeApps = (request) => {
  return axios
    .get(`/middleend/projects/${request.projectName}/composite-apps`, {
      params: { filter: "depthAll" },
    })
    .then((res) => {
      return res.data;
    });
};

const getCreatedCompositeApps = (request) => {
  return axios
    .get(`/middleend/projects/${request.projectName}/composite-apps`, {
      params: { filter: "depthAll", status: "created" },
    })
    .then((res) => {
      return res.data;
    });
};

const getCompositeAppDetails = (request) => {
  return axios
    .get(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}`,
      { params: { filter: "depthAll" } }
    )
    .then((res) => {
      return res.data;
    });
};

const getCompositeAppVersions = (request) => {
  return axios
    .get(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/versions`,
      { params: request.state ? { state: "created" } : {} }
    )
    .then((res) => res.data);
};

const removeAppFromService = (request) => {
  return axios
    .delete(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/apps/${request.appName}`
    )
    .then((res) => {
      return res.data;
    });
};

const updateService = (request) => {
  let params;
  if (request.get("operation") && request.get("operation") === "updateApp") {
    params = { operation: "updateApp" };
  }
  return axios
    .post(
      `/middleend/projects/${request.get(
        "projectName"
      )}/composite-apps/${request.get("compositeAppName")}/${request.get(
        "compositeAppVersion"
      )}/app`,
      request,
      { params: params }
    )
    .then((res) => {
      return res.data;
    });
};

const createDeploymentIntentGroup = (request) => {
  return axios
    .post(
      `/middleend/projects/${request.spec.projectName}/composite-apps/${request.compositeApp}/${request.compositeAppVersion}/deployment-intent-groups`,
      { ...request }
    )
    .then((res) => {
      return res.data;
    });
};
const getDeploymentIntentGroups = (request) => {
  return axios
    .get(`/middleend/projects/${request.projectName}/deployment-intent-groups`)
    .then((res) => {
      return res.data;
    });
};
const deleteDeploymentIntentGroup = (request) => {
  return axios
    .delete(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}`,
      { params: { operation: "deleteAll" } }
    )
    .then((res) => {
      return res.data;
    });
};

const getDeploymentIntentGroupStatus = (request) => {
  return axios
    .get(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/status`
    )
    .then((res) => {
      return res.data;
    });
};

const getDashboardData = (projectName) => {
  return axios
    .get(`/middleend/projects/${projectName}/dashboard`)
    .then((res) => res.data);
};

const createLogicalCloud = (request) => {
  return axios
    .post(
      `/middleend/projects/${request.projectName}/logical-clouds`,
      request.payload
    )
    .then((res) => {
      return res.data;
    });
};

const getLogicalCloudsDetail = (projectName) => {
  return axios
    .get(`/middleend/projects/${projectName}/logical-clouds`)
    .then((res) => {
      return res.data;
    });
};

const getAllClusters = () => {
  return axios.get(`/middleend/all-clusters`).then((res) => {
    return res.data;
  });
};

const getAllClusterNetworks = (request) => {
  return axios
    .get(
      `/middleend/cluster-providers/${request.providerName}/clusters/${request.clusterName}/networks`
    )
    .then((res) => res.data);
};

const getCheckoutServiceInstance = (request) => {
  return axios
    .get(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/checkout
    `
    )
    .then((res) => res.data);
};

const checkoutServiceInstance = (request) => {
  return axios
    .post(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/checkout`,
      null,
      {
        params: { operation: "update" },
      }
    )
    .then((res) => res.data);
};

const saveCheckoutServiceInstance = (request) => {
  return axios
    .put(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/checkout`,
      request.payload,
      {
        params: { operation: "save" },
      }
    )
    .then((res) => res.data);
};

const deleteCheckoutServiceInstance = (request) => {
  return axios
    .delete(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}`,
      {
        params: { operation: "local" },
      }
    )
    .then((res) => res);
};

const submitCheckoutServiceInstance = (request) => {
  return axios
    .post(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/checkout/submit`
    )
    .then((res) => res.data);
};

const migrateServiceInstance = (request) => {
  return axios
    .post(
      `/middleend/projects/${request.projectName}/composite-apps/${request.compositeAppName}/${request.compositeAppVersion}/deployment-intent-groups/${request.deploymentIntentGroupName}/checkout`,
      null,
      {
        params: { operation: "migrate", targetVersion: request.targetVersion },
      }
    )
    .then((res) => res.data);
};

const vimService = {
  createProject,
  updateProject,
  deleteProject,
  getProjectDetails,
  getAllProjects,
  getClusterProviders,
  getClusterProvider,
  getClusters,
  getClustersByLabel,
  registerClusterProvider,
  getClusterNetworks,
  getClusterProviderNetworks,
  addCluster,
  updateCluster,
  getClusterLabels,
  addNetwork,
  deleteClusterNetwork,
  applyNetworkConfig,
  getCompositeApps,
  getProfiles,
  createCompositeApp,
  addService,
  updateCompositeApp,
  deleteCompositeApp,
  getApps,
  addApp,
  updateApp,
  deleteApp,
  createCompositeProfile,
  getCompositeProfiles,
  deleteCompositeProfile,
  addProfile,
  deleteProfile,
  getGenericPlacementIntents,
  createGenericPlacementIntent,
  deleteGenericPlacementIntent,
  getAppPlacementIntents,
  addAppPlacementIntent,
  deleteAppPlacementIntent,
  getNetworkControllerIntents,
  addNetworkControllerIntent,
  deleteNetworkControllerIntent,
  getWorkloadIntents,
  addWorkloadIntent,
  deleteWorkloadIntent,
  getInterfaces,
  addInterface,
  deleteInterface,
  createDeploymentIntentGroup,
  addIntentsToDeploymentIntentGroup,
  getDeploymentIntentGroups,
  editDeploymentIntentGroup,
  deleteDeploymentIntentGroup,
  getDeploymentIntentGroupIntents,
  deleteClusterProvider,
  updateClusterProvider,
  deleteCluster,
  deleteClusterLabel,
  addClusterLabel,
  approveDeploymentIntentGroup,
  instantiate,
  terminateDeploymentIntentGroup,
  getDeploymentIntentGroupStatus,
  getControllers,
  addController,
  updateController,
  removeController,
  getBlueprintConfig,
  getAppBlueprintConfig,
  executeWorkflow,
  checkoutService,
  getAllCompositeApps,
  getCreatedCompositeApps,
  getCompositeAppDetails,
  getCompositeAppVersions,
  removeAppFromService,
  updateService,
  checkInService,
  getDashboardData,
  getLogicalClouds,
  createLogicalCloud,
  getLogicalCloudsDetail,
  getLogicalCloudClusterReferences,
  terminateLogicalCloud,
  deleteLogicalCloudClusterReference,
  deleteLogicalCloud,
  getAllClusters,
  getAllClusterNetworks,
  terminateNetworkConfig,
  checkoutServiceInstance,
  getCheckoutServiceInstance,
  saveCheckoutServiceInstance,
  deleteCheckoutServiceInstance,
  submitCheckoutServiceInstance,
  migrateServiceInstance,
};
export default vimService;
