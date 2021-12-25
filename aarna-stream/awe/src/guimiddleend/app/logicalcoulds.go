package app

import (
	"encoding/json"
	"net/http"

	log "github.com/sirupsen/logrus"
)

type logicalCloudData struct {
	Metadata apiMetaData      `json:"metadata"`
	Spec     logicalCloudSpec `json:"spec"`
}

// Logical cloud spec
type logicalCloudSpec struct {
	Level string `json:"level"`
}

type ClusterLabels struct {
	Metadata apiMetaData `json:"metadata"`
	Labels    []Labels `json:"labels"`
}

type clusterReferenceFlat struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Userdata1   string `json:"userData1"`
		Userdata2   string `json:"userData2"`
	} `json:"metadata"`
	Spec struct {
		ClusterProvider string `json:"cluster-provider"`
		ClusterName     string `json:"cluster-name"`
		LoadbalancerIP  string `json:"loadbalancer-ip"`
		Certificate     string `json:"certificate,omitempty"`
		LabelList []Labels `json:"labels,omitempty"`
	} `json:"spec"`
}

type clusterReferenceNested struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	} `json:"metadata"`
	Spec struct {
		ClusterProvidersList []ClusterProviders `json:"clusterProviders"`
	} `json:"spec"`
}

type ClusterProviders struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	} `json:"metadata"`
	Spec struct {
		ClustersList []Clusters `json:"clusters"`
	} `json:"spec"`
}
type Clusters struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	} `json:"metadata"`
	Spec struct {
		Labels []Labels `json:"labels"`
	} `json:"spec"`
}

type Labels struct {
		LabelName        string `json:"label-name"`
}

type LogicalClouds struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Userdata1   string `json:"userData1"`
		Userdata2   string `json:"userData2"`
	} `json:"metadata"`
	Spec struct {
		Namespace string `json:"namespace"`
		Level     string `json:"level"`
		User      struct {
			UserName        string      `json:"user-name"`
			Type            string      `json:"type"`
			UserPermissions interface{} `json:"user-permissions"`
		} `json:"user"`
	} `json:"spec"`
}

// logicalCloudHandler implements the orchworkflow interface
type logicalCloudHandler struct {
	orchInstance *OrchestrationHandler
}

func (h *logicalCloudHandler) getLogicalClouds() ([]LogicalClouds, interface{}) {
	orch := h.orchInstance
	var lc []LogicalClouds
	projectName := orch.Vars["project-name"]
	url := "http://" + orch.MiddleendConf.Dcm + "/v2/projects/" +
		projectName + "/logical-clouds"
	retcode, respval, err := orch.apiGet(url, projectName)
	log.Infof("Get LC status: %d", retcode)
	if err != nil {
		log.Errorf("Failed to LC for %s", projectName)
		return nil, http.StatusInternalServerError
	}
	if retcode != http.StatusOK {
		log.Errorf("Failed to LC for %s", projectName)
		return nil, retcode
	}
	json.Unmarshal(respval, &lc)
	return lc, nil
}


func (h *logicalCloudHandler) getLogicalCloudReferences(lcName string) (clusterReferenceNested, interface{}) {
	orch := h.orchInstance
	var lcRefList []clusterReferenceFlat
	projectName := orch.Vars["project-name"]
	url := "http://" + orch.MiddleendConf.Dcm + "/v2/projects/" +
		projectName + "/logical-clouds/" + lcName + "/cluster-references"
	retcode, respval, err := orch.apiGet(url, lcName)
	log.Infof("Get LC references status: %d", retcode)
	if err != nil {
		log.Errorf("Failed to LC reference for %s", lcName)
		return clusterReferenceNested{}, http.StatusInternalServerError
	}
	if retcode != http.StatusOK {
		log.Errorf("Failed to LC reference for %s", lcName)
		return clusterReferenceNested{}, retcode
	}
	json.Unmarshal(respval, &lcRefList)

	// Fetch label information of all clusters belonging to cluster provider part of logical cloud
	clusterProviders := make(map[string]bool)
	for _, cluRef := range lcRefList {
		clusterProviders[cluRef.Spec.ClusterProvider] = true
	}

	// Build a map of cluster providers to clusters list
	var clusterProviderMap = make(map[string][]Clusters, len(lcRefList))

	for clusterProvider, _ := range clusterProviders {
		var clusterLabels []ClusterLabels
		url := "http://" + orch.MiddleendConf.Clm + "/v2/cluster-providers/" +
			clusterProvider + "/clusters?withLabels=true"
		retcode, respval, err := orch.apiGet(url, clusterProvider)
		if retcode != http.StatusOK {
			log.Errorf("Encountered error while fetching labels for cluster provider %s", clusterProvider)
			return clusterReferenceNested{}, retcode
		}
		if err != nil {
			log.Errorf("Failed while fetching labels for cluster provider %s", clusterProvider)
			return clusterReferenceNested{}, http.StatusInternalServerError
		}

		json.Unmarshal(respval, &clusterLabels)

		for _, ref := range lcRefList {
			var cluster Clusters
			cluster.Metadata.Name = ref.Spec.ClusterName
			cluster.Metadata.Description = "Cluster" + ref.Spec.ClusterName
			for _, cinfo := range clusterLabels {
				if ref.Spec.ClusterProvider == clusterProvider && ref.Spec.ClusterName == cinfo.Metadata.Name {
					cluster.Spec.Labels = cinfo.Labels
				}
			}
			if clusterProvider == ref.Spec.ClusterProvider {
				clusterProviderMap[clusterProvider] = append(clusterProviderMap[clusterProvider],
					cluster)
			}
		}
	}

	// parse through the output and fill int he reference nested structure
	// that is to be returned to the GUI
	var nestedRef clusterReferenceNested
	nestedRef.Metadata.Name = lcName
	nestedRef.Metadata.Description = "Cluster references for" + lcName

	for k, v := range clusterProviderMap {
		l := ClusterProviders{}
		l.Metadata.Name = k
		l.Metadata.Description = "cluster provider : " + k
		l.Spec.ClustersList = make([]Clusters, len(v))
		l.Spec.ClustersList = v
		nestedRef.Spec.ClusterProvidersList = append(nestedRef.Spec.ClusterProvidersList, l)
	}
	return nestedRef, nil
}

func (h *logicalCloudHandler) createLogicalCloud(lcData logicalCloudsPayload) interface{} {
	orch := h.orchInstance
	vars := orch.Vars

	// Create the logical cloud
	apiPayload := logicalCloudData{
		Metadata: apiMetaData{
			Name:        lcData.Name,
			Description: lcData.Description,
			UserData1:   "data 1",
			UserData2:   "data 2"},
		Spec: logicalCloudSpec{
			Level: "0",
		},
	}
	jsonLoad, _ := json.Marshal(apiPayload)
	url := "http://" + orch.MiddleendConf.Dcm + "/v2/projects/" +
		vars["project-name"] + "/logical-clouds"
	resp, err := orch.apiPost(jsonLoad, url, lcData.Name)
	if err != nil {
		return err
	}
	if resp != http.StatusCreated {
		return resp
	}
	log.Infof("Call create logical-cloud response: %d", resp)

	// Now Create the reference for each cluster in the logical cloud
	for _, clusterProvider := range lcData.Spec.ClustersProviders {
		for _, cluster := range clusterProvider.Spec.Clusters {
			clusterReferencePayload := clusterReferenceFlat{}
			clusterReferencePayload.Metadata.Name = lcData.Name + "-" +
				clusterProvider.Metadata.Name + "-" + cluster.Metadata.Name
			clusterReferencePayload.Metadata.Description = "Cluster reference for cluster" +
				clusterProvider.Metadata.Name + ":" + cluster.Metadata.Name
			clusterReferencePayload.Metadata.Userdata1 = "NA"
			clusterReferencePayload.Metadata.Userdata2 = "NA"
			clusterReferencePayload.Spec.ClusterProvider = clusterProvider.Metadata.Name
			clusterReferencePayload.Spec.ClusterName = cluster.Metadata.Name
			clusterReferencePayload.Spec.LoadbalancerIP = "0.0.0.0"
			jsonLoad, _ := json.Marshal(clusterReferencePayload)
			url := "http://" + orch.MiddleendConf.Dcm + "/v2/projects/" +
				vars["project-name"] + "/logical-clouds/" + lcData.Name + "/cluster-references"
			resp, err := orch.apiPost(jsonLoad, url, lcData.Name+"-"+cluster.Metadata.Name)
			if err != nil {
				return err
			}
			if resp != http.StatusCreated {
				return resp
			}
		}
	}

	// Instantiate the cluser.
	url = "http://" + orch.MiddleendConf.Dcm + "/v2/projects/" +
		vars["project-name"] + "/logical-clouds/" + lcData.Name + "/instantiate"
	resp, err = orch.apiPost(jsonLoad, url, lcData.Name+"-instantiate")
	if err != nil {
		return err
	}
	if resp != http.StatusCreated {
		return resp
	}
	return nil
}
