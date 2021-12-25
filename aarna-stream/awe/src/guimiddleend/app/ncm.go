package app

import (
	"encoding/json"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"
)

// logicalCloudHandler implements the orchworkflow interface
type ncmHandler struct {
	orchInstance *OrchestrationHandler
}

type network struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Userdata1   string `json:"userData1"`
		Userdata2   string `json:"userData2"`
	} `json:"metadata"`
	Spec struct {
		RsyncStatus string `json:"rsync-status"`
		Cnitype     string `json:"cniType"`
		Ipv4Subnets []struct {
			Subnet     string `json:"subnet"`
			Name       string `json:"name"`
			Gateway    string `json:"gateway"`
			Excludeips string `json:"excludeIps"`
		} `json:"ipv4Subnets"`
	} `json:"spec"`
}

type providerNetwork struct {
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Userdata1   string `json:"userData1"`
		Userdata2   string `json:"userData2"`
	} `json:"metadata"`
	Spec struct {
		RsyncStatus string `json:"rsync-status"`
		Cnitype     string `json:"cniType"`
		Ipv4Subnets []struct {
			Subnet     string `json:"subnet"`
			Name       string `json:"name"`
			Gateway    string `json:"gateway"`
			Excludeips string `json:"excludeIps"`
		} `json:"ipv4Subnets"`
		Providernettype string `json:"providerNetType"`
		Vlan            struct {
			Vlanid                string   `json:"vlanID"`
			Providerinterfacename string   `json:"providerInterfaceName"`
			Logicalinterfacename  string   `json:"logicalInterfaceName"`
			Vlannodeselector      string   `json:"vlanNodeSelector"`
			Nodelabellist         []string `json:"nodeLabelList"`
		} `json:"vlan"`
	} `json:"spec"`
}

type networkStatus struct {
	Name   string `json:"name"`
	States struct {
		Actions []struct {
			State    string    `json:"state"`
			Instance string    `json:"instance"`
			Time     time.Time `json:"time"`
		} `json:"actions"`
	} `json:"states"`
	Status      string `json:"status,omitempty"`
	RsyncStatus struct {
		Applied int `json:"Applied"`
	} `json:"rsync-status"`
	Cluster struct {
		ClusterProvider string `json:"cluster-provider"`
		Cluster         string `json:"cluster"`
		Resources       []struct {
			Gvk struct {
				Group   string `json:"Group"`
				Version string `json:"Version"`
				Kind    string `json:"Kind"`
			} `json:"GVK"`
			Name        string `json:"name"`
			RsyncStatus string `json:"rsync-status"`
		} `json:"resources"`
	} `json:"cluster"`
}

type ConsolidatedStatus struct {
	Metadata struct {
		Name string `json:"name"`
	} `json:"metadata"`
	Spec struct {
		Status           string            `json:"status"`
		ProviderNetworks []providerNetwork `json:"provider-networks"`
		Networks         []network         `json:"networks"`
	} `json:"spec"`
}

func (h *ncmHandler) getNetworks() (interface{}, interface{}) {
	orch := h.orchInstance
	// Call the networks status
	// http://192.168.122.240:30431/v2/cluster-providers/cluster-provider-a/clusters/kud2/status
	var nwStatus networkStatus
	clusterProvider := orch.Vars["clusterprovider-name"]
	clusterName := orch.Vars["cluster-name"]
	url := "http://" + orch.MiddleendConf.Ncm + "/v2/cluster-providers/" +
		clusterProvider + "/clusters/" + clusterName + "/status"

	retcode, respval, err := orch.apiGet(url, clusterProvider)
	log.Infof("Get cluster status : %d", retcode)
	if err != nil {
		log.Errorf("Failed to get cluster status for %s: ", clusterName)
		return nil, http.StatusInternalServerError
	}
	if retcode != http.StatusOK {
		log.Errorf("Failed to get cluster status for %s: ", clusterName)
		return nil, retcode
	}
	json.Unmarshal(respval, &nwStatus)

	// Get all networks
	var nw []network
	url = "http://" + orch.MiddleendConf.Ncm + "/v2/cluster-providers/" +
		clusterProvider + "/clusters/" + clusterName + "/networks"

	retcode, respval, err = orch.apiGet(url, clusterProvider)
	log.Infof("Get cluster networks : %d", retcode)
	if err != nil {
		log.Errorf("Failed to get cluster networks %s: ", clusterName)
		return nil, http.StatusInternalServerError
	}
	if retcode != http.StatusOK {
		log.Errorf("Failed to get cluster networks %s: ", clusterName)
		return nil, retcode
	}
	json.Unmarshal(respval, &nw)
	for i, _ := range nw {
		nw[i].Spec.RsyncStatus = "Created"
	}

	// Parse the Clusters array of the status and add the populate the rsync state.
	for _, v := range nwStatus.Cluster.Resources {
		for i, _ := range nw {
			if v.Gvk.Kind == "Network" && v.Name == nw[i].Metadata.Name {
				nw[i].Spec.RsyncStatus = v.RsyncStatus
			}
		}
	}

	// Get all provider networks
	var pnw []providerNetwork
	url = "http://" + orch.MiddleendConf.Ncm + "/v2/cluster-providers/" +
		clusterProvider + "/clusters/" + clusterName + "/provider-networks"

	retcode, respval, err = orch.apiGet(url, clusterProvider)
	log.Infof("Get cluster provider networks : %d", retcode)
	if err != nil {
		log.Errorf("Failed to get cluster provider networks %s: ", clusterName)
		return nil, http.StatusInternalServerError
	}
	if retcode != http.StatusOK {
		log.Errorf("Failed to get cluster provider networks %s: ", clusterName)
		return nil, retcode
	}
	json.Unmarshal(respval, &pnw)
	for i, _ := range pnw {
		pnw[i].Spec.RsyncStatus = "Created"
	}

	// Parse the Clusters array of the status and add the populate the rsync state.
	for _, v := range nwStatus.Cluster.Resources {
		for i, _ := range pnw {
			if v.Gvk.Kind == "ProviderNetwork" && v.Name == pnw[i].Metadata.Name {
				pnw[i].Spec.RsyncStatus = v.RsyncStatus
			}
		}
	}

	// Populate the consolidated status
	cs := ConsolidatedStatus{}
	cs.Metadata.Name = clusterName
	cs.Spec.Status = nwStatus.Status
	if cs.Spec.Status == "" {
		cs.Spec.Status = nwStatus.States.Actions[len(nwStatus.States.Actions)-1].State
	}
	cs.Spec.Networks = append(cs.Spec.Networks, nw...)
	cs.Spec.ProviderNetworks = append(cs.Spec.ProviderNetworks, pnw...)

	return cs, nil
}
