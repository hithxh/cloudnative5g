package app

import (
	"encoding/json"
	"net/http"

	pkgerrors "github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
)

type DashboardClient struct {
	orchInstance *OrchestrationHandler
}

type DashboardData struct {
	CompositeAppCount          int `json:"composite_app_count"`
	DeploymentIntentGroupCount int `json:"deployment_intent_group_count"`
	ClusterCount               int `json:"cluster_count"`
}

type ClusterProvider struct {
	Metadata apiMetaData         `json:"metadata"`
	Spec     ClusterProviderSpec `json:"spec"`
}

type ClusterProviderSpec struct {
	Clusters []Cluster `json:"clusters"`
}

type Cluster struct {
	Metadata apiMetaData `json:"metadata"`
}

type ClusterLabel struct {
	LabelName string `json:"label-name"`
}

// getClusterProviders fetches all the available cluster providers
func (h *DashboardClient) getClusterProviders() interface{} {
	var clusterProviderList []ClusterProvider
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.Clm + "/v2/cluster-providers"
	respcode, respdata, err := orch.apiGet(url, "getClusterProviders")
	log.Infof("Get cluster providers status: %d", respcode)
	orch.response.lastKey = "getClusterProviders"
	if err != nil {
		return pkgerrors.New("Error getting ClusterProviders")
	}
	if respcode != 200 {
		//return pkgerrors.New("Error getting ClusterProvider")
		return respcode
	}
	json.Unmarshal(respdata, &clusterProviderList)
	orch.ClusterProviders = clusterProviderList
	return nil
}

//getClusters iterates thought all the cluster providers and gets the clusters in them
func (h *DashboardClient) getClusters() interface{} {
	orch := h.orchInstance
	for index, provider := range orch.ClusterProviders {
		var ClusterList []Cluster
		url := "http://" + orch.MiddleendConf.Clm + "/v2/cluster-providers/" + provider.Metadata.Name + "/clusters"
		orch.response.lastKey = "getClusters"
		respcode, respdata, err := orch.apiGet(url, "getClusters")
		if err != nil {
			return err
		}
		if respcode != http.StatusOK {
			//return pkgerrors.New("Error getting ClusterProvider")
			return respcode
		}
		json.Unmarshal(respdata, &ClusterList)
		orch.ClusterProviders[index].Spec.Clusters = ClusterList
		log.Infof("Get clusters status: %d", respcode)
	}
	return nil
}

func (h *DashboardClient) createCompositeAppTree() error {
	orch := h.orchInstance
	orch.treeFilter = nil
	orch.response.status = make(map[string]int)
	orch.response.payload = make(map[string][]byte)
	orch.prepTreeReq()
	dataPoints := []string{"projectHandler", "compAppHandler", "digpHandler"}
	orch.dataRead = &ProjectTree{}
	retcode := orch.constructTree(dataPoints)
	if retcode != nil {
		pkgerrors.New("Error getting composite apps data")
	}
	return nil
}

func (h *DashboardClient) getAllClusters() interface{} {
	err := h.getClusterProviders()
	if err != nil {
		return err
	}
	err = h.getClusters()
	if err != nil {
		return err
	}

	return nil
}

//getDashboardData based on compositeapp data and clusters data,
//calculates the no of compositeapps (versions are not added to the count), deployment-intent-groups and clusters.
func (h *DashboardClient) getDashboardData() (DashboardData, interface{}) {
	orch := h.orchInstance
	err := h.createCompositeAppTree()
	if err != nil {
		return DashboardData{}, err
	}
	respcode := h.getClusterProviders()
	if respcode != nil {
		return DashboardData{}, respcode
	}
	respcode = h.getClusters()
	if err != nil {
		return DashboardData{}, respcode
	}

	dataRead := orch.dataRead
	orch.CompositeAppReturnJSONShrunk = nil
	var retData DashboardData
	retData.CompositeAppCount = 0
	retData.DeploymentIntentGroupCount = 0
	retData.ClusterCount = 0
	for compositeAppName := range dataRead.compositeAppMap {

		retData.DeploymentIntentGroupCount = retData.DeploymentIntentGroupCount + len(dataRead.compositeAppMap[compositeAppName].DigMap)

		if orch.CompositeAppReturnJSONShrunk != nil {
			for index, compositeApp := range orch.CompositeAppReturnJSONShrunk {
				if compositeApp.Metadata.Name == dataRead.compositeAppMap[compositeAppName].Metadata.Metadata.Name {
					break
				} else if index == (len(orch.CompositeAppReturnJSONShrunk) - 1) {
					retData.CompositeAppCount++
				}
			}
		} else {
			retData.CompositeAppCount++
		}
	}

	//calculate total clusters
	for _, provider := range orch.ClusterProviders {
		retData.ClusterCount = retData.ClusterCount + len(provider.Spec.Clusters)
	}

	return retData, nil
}
