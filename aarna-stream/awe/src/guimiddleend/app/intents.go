package app

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"example.com/middleend/localstore"
	log "github.com/sirupsen/logrus"
)

type PlacementIntentExport struct {
	Metadata localstore.MetaData          `json:"metadata"`
	Spec     AppPlacementIntentSpecExport `json:"spec"`
}

type AppPlacementIntentSpecExport struct {
	AppName string            `json:"appName"`
	Intent  arrayIntentExport `json:"intent"`
}
type arrayIntentExport struct {
	AllofCluster []AllofExport `json:"allof"`
	AnyofCluster []AnyofExport `json:"anyof"`
}
type AllofExport struct {
	ProviderName string `json:"providerName"`
	ClusterName  string `json:"clusterName"`
	ClusterLabelName  string `json:"clusterLabelName"`
}

type AnyofExport struct {
	ProviderName string `json:"providerName"`
	ClusterName  string `json:"clusterName"`
	ClusterLabelName  string `json:"clusterLabelName"`
}

// plamcentIntentHandler implements the orchworkflow interface
type placementIntentHandler struct {
	orchURL      string
	orchInstance *OrchestrationHandler
}

type NetworkCtlIntent struct {
	Metadata apiMetaData `json:"metadata"`
}

type NetworkWlIntent struct {
	Metadata apiMetaData        `json:"metadata"`
	Spec     WorkloadIntentSpec `json:"spec"`
}

type WorkloadIntentSpec struct {
	AppName  string `json:"application-name"`
	Resource string `json:"workload-resource"`
	Type     string `json:"type"`
}

type NwInterface struct {
	Metadata apiMetaData   `json:"metadata"`
	Spec     InterfaceSpec `json:"spec"`
}

type InterfaceSpec struct {
	Interface      string `json:"interface"`
	Name           string `json:"name"`
	DefaultGateway string `json:"defaultGateway"`
	IPAddress      string `json:"ipAddress"`
	MacAddress     string `json:"macAddress"`
	SubNet		   string `json:"subnet,omitempty"`
}

// networkIntentHandler implements the orchworkflow interface
type networkIntentHandler struct {
	ovnURL       string
	orchInstance *OrchestrationHandler
}

// localStoreIntentHandler implements the orchworkflow interface
type localStoreIntentHandler struct {
	orchInstance *OrchestrationHandler
}
type remoteStoreIntentHandler struct {
	orchInstance *OrchestrationHandler
}

// localStoreNwintHandler implements the orchworkflow interface
type localStoreNwintHandler struct {
	orchInstance *OrchestrationHandler
}
type remoteStoreNwintHandler struct {
	orchInstance *OrchestrationHandler
}

// Interface to creating the backend objects
// either in EMCO over REST or in middleend mongo
type backendStore interface {
	createGpint(localstore.GenericPlacementIntent, string, string, string, string) (interface{}, interface{})
	deleteGpint(string, string, string, string, string) (interface{}, interface{})
	createAppPIntent(localstore.AppIntent, string, string, string, string, string) (interface{}, interface{})
	deleteAppPIntent(ai string, p string, ca string, v string,
		gpintName string, digName string) (interface{}, interface{})
	getAllGPint(project string, compositeAppName string, version string, digName string) (interface{}, []byte, interface{})
	getAppPIntent(intentName string, gpintName string, project string, compositeAppName string, version string,
		digName string) (interface{}, []byte, interface{})
	createControllerIntent(cint localstore.NetControlIntent, p string, ca string, v string,
		digName string, exists bool, intentName string) (interface{}, interface{})
	getControllerIntents(p string, ca string, v string,
		digName string) (interface{}, []byte, interface{})
	deleteControllerIntent(p string, ca string, v string,
		digName string, intentName string) (interface{}, interface{})
	createWorkloadIntent(cint localstore.WorkloadIntent, p string, ca string, v string,
		digName string, nwControllerIntentName string, exists bool, intentName string) (interface{}, interface{})
	getWorkloadIntents(p string, ca string, v string,
		digName string, nwControllerIntentName string) (interface{}, []byte, interface{})
	deleteWorkloadIntent(workloadIntentName, p string, ca string, v string,
		digName string, nwControllerIntentName string) (interface{}, interface{})
	createWorkloadIfIntent(cint localstore.WorkloadIfIntent, p string, ca string, v string,
		digName string, nwControllerIntentName string, workloadIntentName string, exists bool, intentName string) (interface{}, interface{})
	getWorkloadIfIntents(p string, ca string, v string,
		digName string, nwControllerIntentName string, workloadIntentName string) (interface{}, []byte, interface{})
	deleteWorkloadIfIntent(ifaceName string, workloadIntentName, p string, ca string, v string,
		digName string, nwControllerIntentName string) (interface{}, interface{})
}

func (h *remoteStoreIntentHandler) createWorkloadIfIntent(wifint localstore.WorkloadIfIntent, p string, ca string, v string,
	digName string, nwControllerIntentName string, workloadIntentName string, exists bool, intentName string) (interface{}, interface{}) {
	orch := h.orchInstance
	jsonLoad, _ := json.Marshal(wifint)
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" +
		nwControllerIntentName + "/workload-intents/" + workloadIntentName + "/interfaces"
	resp, err := orch.apiPost(jsonLoad, url, intentName)
	return resp, err
}

func (h *localStoreIntentHandler) createWorkloadIfIntent(wifint localstore.WorkloadIfIntent, p string, ca string, v string,
	digName string, nwControllerIntentName string, workloadIntentName string, exists bool, intentName string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewWorkloadIfIntentClient()
	_, createErr := c.CreateWorkloadIfIntent(wifint, p, ca, v, digName, nwControllerIntentName, workloadIntentName, true)
	if createErr != nil {
		log.Error(":: Error creating workload interface ::", log.Fields{"Error": createErr})
		if strings.Contains(createErr.Error(), "does not exist") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "WorkloadIfIntent already exists") {
			return http.StatusConflict, createErr
		} else {
			return http.StatusInternalServerError, createErr
		}
	}
	return http.StatusCreated, createErr
}

func (h *remoteStoreIntentHandler) getWorkloadIfIntents(p string, ca string, v string,
	digName string, nwControllerIntent string, workloadIntentName string) (interface{}, []byte, interface{}) {
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" +
		nwControllerIntent + "/workload-intents/" + workloadIntentName + "/interfaces"
	resp, retval, err := orch.apiGet(url, ca+"_getifaces")
	return resp, retval, err
}

func (h *localStoreIntentHandler) getWorkloadIfIntents(p string, ca string, v string,
	digName string, nwControllerIntent string, workloadIntentName string) (interface{}, []byte, interface{}) {
	// Get the local store handler.
	var retval []byte
	c := localstore.NewWorkloadIfIntentClient()
	interfaces, err := c.GetWorkloadIfIntents(p, ca, v, digName, nwControllerIntent, workloadIntentName)
	if err != nil {
		log.Error(":: Error getting workload interfaces ::", log.Fields{"Error": err})
		if strings.Contains(err.Error(), "db Find error") {
			return http.StatusNotFound, retval, err
		} else {
			return http.StatusInternalServerError, retval, err
		}
	}
	retval, _ = json.Marshal(interfaces)
	return http.StatusOK, retval, err
}

func (h *remoteStoreIntentHandler) deleteWorkloadIfIntent(ifaceName string, workloadIntentName string, p string, ca string, v string,
	digName string, nwControllerIntent string) (interface{}, interface{}) {
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" +
		nwControllerIntent + "/workload-intents/" + workloadIntentName + "/interfaces/" + ifaceName
	resp, err := orch.apiDel(url, ca+"_delIface")
	return resp, err
}

func (h *localStoreIntentHandler) deleteWorkloadIfIntent(ifaceName string, workloadIntentName string, p string, ca string, v string,
	digName string, nwControllerIntent string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewWorkloadIfIntentClient()
	err := c.DeleteWorkloadIfIntent(ifaceName, p, ca, v, digName, nwControllerIntent, workloadIntentName)
	if err != nil {
		log.Error(":: Error deleting workloadIfIntent ::", log.Fields{"Error": err, "Name": ifaceName})
		if strings.Contains(err.Error(), "not found") {
			return http.StatusNotFound, err
		} else if strings.Contains(err.Error(), "conflict") {
			return http.StatusConflict, err
		} else {
			return http.StatusInternalServerError, err
		}
	}
	return http.StatusNoContent, err
}

func (h *remoteStoreIntentHandler) createWorkloadIntent(wint localstore.WorkloadIntent, p string, ca string, v string,
	digName string, nwControllerIntentName string, exists bool, intentName string) (interface{}, interface{}) {
	orch := h.orchInstance
	jsonLoad, _ := json.Marshal(wint)
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" +
		nwControllerIntentName + "/workload-intents"
	resp, err := orch.apiPost(jsonLoad, url, intentName)
	return resp, err
}

func (h *localStoreIntentHandler) createWorkloadIntent(wint localstore.WorkloadIntent, p string, ca string, v string,
	digName string, nwControllerIntentName string, exists bool, intentName string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewWorkloadIntentClient()
	_, createErr := c.CreateWorkloadIntent(wint, p, ca, v, digName, nwControllerIntentName, true)
	if createErr != nil {
		log.Error(":: Error creating workload intent ::", log.Fields{"Error": createErr})
		if strings.Contains(createErr.Error(), "does not exist") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "WorkloadIntent already exists") {
			return http.StatusConflict, createErr
		} else {
			return http.StatusInternalServerError, createErr
		}
	}
	return http.StatusCreated, createErr
}

func (h *remoteStoreIntentHandler) getWorkloadIntents(p string, ca string, v string,
	digName string, nwControllerIntent string) (interface{}, []byte, interface{}) {
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" +
		nwControllerIntent + "/workload-intents"
	resp, retval, err := orch.apiGet(url, ca+"_getWrkInt")
	return resp, retval, err
}

func (h *localStoreIntentHandler) getWorkloadIntents(p string, ca string, v string,
	digName string, nwControllerIntent string) (interface{}, []byte, interface{}) {
	// Get the local store handler.
	var retval []byte
	c := localstore.NewWorkloadIntentClient()
	workloadIntents, err := c.GetWorkloadIntents(p, ca, v, digName, nwControllerIntent)
	if err != nil {
		log.Error(":: Error getting workload intents ::", log.Fields{"Error": err})
		if strings.Contains(err.Error(), "db Find error") {
			return http.StatusNotFound, retval, err
		} else {
			return http.StatusInternalServerError, retval, err
		}
	}
	retval, _ = json.Marshal(workloadIntents)
	return http.StatusOK, retval, err
}

func (h *remoteStoreIntentHandler) deleteWorkloadIntent(workloadIntentName string, p string, ca string, v string,
	digName string, nwControllerIntent string) (interface{}, interface{}) {
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" +
		nwControllerIntent + "/workload-intents/" + workloadIntentName
	resp, err := orch.apiDel(url, ca+"_delWrkInt")
	return resp, err
}

func (h *localStoreIntentHandler) deleteWorkloadIntent(workloadIntentName string, p string, ca string, v string,
	digName string, nwControllerIntent string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewWorkloadIntentClient()
	err := c.DeleteWorkloadIntent(workloadIntentName, p, ca, v, digName, nwControllerIntent)
	if err != nil {
		log.Error(":: Error deleting workload intent ::", log.Fields{"Error": err, "Name": workloadIntentName})
		if strings.Contains(err.Error(), "not found") {
			return http.StatusNotFound, err
		} else if strings.Contains(err.Error(), "conflict") {
			return http.StatusConflict, err
		} else {
			return http.StatusInternalServerError, err
		}
	}
	return http.StatusNoContent, err
}

func (h *remoteStoreIntentHandler) createControllerIntent(cint localstore.NetControlIntent, p string, ca string, v string,
	digName string, exists bool, intentName string) (interface{}, interface{}) {
	orch := h.orchInstance
	jsonLoad, _ := json.Marshal(cint)
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent"
	resp, err := orch.apiPost(jsonLoad, url, intentName)
	return resp, err
}

func (h *localStoreIntentHandler) createControllerIntent(cint localstore.NetControlIntent, p string, ca string, v string,
	digName string, exists bool, intentName string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewNetControlIntentClient()
	_, createErr := c.CreateNetControlIntent(cint, p, ca, v, digName, true)
	if createErr != nil {
		log.Error(":: Error creating network control intent ::", log.Fields{"Error": createErr})
		if strings.Contains(createErr.Error(), "NetControlIntent already exists") {
			return http.StatusConflict, createErr
		} else {
			return http.StatusInternalServerError, createErr
		}
	}
	return http.StatusCreated, createErr
}

func (h *remoteStoreIntentHandler) getControllerIntents(p string, ca string, v string,
	digName string) (interface{}, []byte, interface{}) {
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent"
	resp, retval, err := orch.apiGet(url, ca+"_getNwCtlInt")
	return resp, retval, err
}

func (h *localStoreIntentHandler) getControllerIntents(p string, ca string, v string,
	digName string) (interface{}, []byte, interface{}) {
	// Get the local store handler.
	var retval []byte
	c := localstore.NewNetControlIntentClient()
	ctlInents, err := c.GetNetControlIntents(p, ca, v, digName)
	if err != nil {
		log.Error(":: Error getting network control intents ::", log.Fields{"Error": err})
		if strings.Contains(err.Error(), "db Find error") {
			return http.StatusNotFound, retval, err
		} else {
			return http.StatusInternalServerError, retval, err
		}
	}
	retval, _ = json.Marshal(ctlInents)
	return http.StatusOK, retval, err
}

func (h *remoteStoreIntentHandler) deleteControllerIntent(nwIntentName string, p string, ca string, v string,
	digName string) (interface{}, interface{}) {
	orch := h.orchInstance
	url := "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/network-controller-intent/" + nwIntentName
	resp, err := orch.apiDel(url, ca+"_delnwCtlInt")
	return resp, err
}

func (h *localStoreIntentHandler) deleteControllerIntent(nwIntentName string, p string, ca string, v string,
	digName string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewNetControlIntentClient()
	err := c.DeleteNetControlIntent(nwIntentName, p, ca, v, digName)
	if err != nil {
		log.Error(":: Error deleting network control intent ::", log.Fields{"Error": err, "Name": nwIntentName})
		if strings.Contains(err.Error(), "not found") {
			return http.StatusNotFound, err
		} else if strings.Contains(err.Error(), "conflict") {
			return http.StatusConflict, err
		} else {
			return http.StatusInternalServerError, err
		}
	}
	return http.StatusNoContent, err
}

func (h *localStoreIntentHandler) getAllGPint(project string, compositeAppName string, version string,
	digName string) (interface{}, []byte, interface{}) {
	var retval []byte
	c := localstore.NewGenericPlacementIntentClient()
	gPIntent, err := c.GetAllGenericPlacementIntents(project, compositeAppName, version, digName)
	if err != nil {
		log.Error(err.Error(), log.Fields{})
		if strings.Contains(err.Error(), "Unable to find") {
			return http.StatusNotFound, retval, err
		} else if strings.Contains(err.Error(), "db Find error") {
			return http.StatusNotFound, retval, err
		} else {
			return http.StatusInternalServerError, retval, err
		}
	}
	log.Infof("Get All gpint localstore Composite app %s dig %s status: %s : value %s", compositeAppName,
		digName, gPIntent)
	retval, _ = json.Marshal(gPIntent)
	return http.StatusOK, retval, err
}

func (h *remoteStoreIntentHandler) getAllGPint(project string, compositeAppName string, version string,
	digName string) (interface{}, []byte, interface{}) {

	orch := h.orchInstance

	orchURL := "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
		project + "/composite-apps/" + compositeAppName +
		"/" + version +
		"/deployment-intent-groups/" + digName + "/generic-placement-intents"
	retcode, retval, err := orch.apiGet(orchURL, compositeAppName+"_gpint")
	log.Infof("Get Gpint in Composite app %s dig %s status: %d", compositeAppName,
		digName, retcode)
	return retcode, retval, err
}

func (h *remoteStoreIntentHandler) getAppPIntent(intentName string, gpintName string, project string, compositeAppName string, version string,
	digName string) (interface{}, []byte, interface{}) {

	orch := h.orchInstance
	orchURL := "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
		project + "/composite-apps/" + compositeAppName +
		"/" + version + "/deployment-intent-groups/" + digName + "/generic-placement-intents"
	url := orchURL + "/" + gpintName + "/app-intents/" + intentName
	retcode, retval, err := orch.apiGet(url, compositeAppName+"_getappPint")
	return retcode, retval, err
}

func (h *localStoreIntentHandler) getAppPIntent(intentName string, gpintName string, project string, compositeAppName string, version string,
	digName string) (interface{}, []byte, interface{}) {
	var retval []byte
	c := localstore.NewAppIntentClient()
	appIntent, err := c.GetAppIntent(intentName, project, compositeAppName, version, gpintName, digName)
	if err != nil {
		log.Error(err.Error(), log.Fields{})
		if strings.Contains(err.Error(), "db Find error") {
			return http.StatusNotFound, retval, err
		} else {
			return http.StatusInternalServerError, retval, err
		}
	}
	retval, _ = json.Marshal(appIntent)
	return http.StatusOK, retval, err
}

func (h *localStoreIntentHandler) createGpint(g localstore.GenericPlacementIntent, p string, ca string,
	v string, digName string) (interface{}, interface{}) {
	c := localstore.NewGenericPlacementIntentClient()

	_, createErr := c.CreateGenericPlacementIntent(g, p, ca, v, digName)
	if createErr != nil {
		log.Error(createErr.Error(), log.Fields{})
		if strings.Contains(createErr.Error(), "Unable to find the project") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "Unable to find the composite-app") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "Unable to find the deployment-intent-group-name") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "Intent already exists") {
			return http.StatusConflict, createErr
		} else {
			return http.StatusInternalServerError, createErr
		}
	}
	return http.StatusCreated, nil
}

func (h *remoteStoreIntentHandler) createGpint(g localstore.GenericPlacementIntent, p string, ca string,
	v string, digName string) (interface{}, interface{}) {
	orch := h.orchInstance
	gPintName := ca + "_gpint"
	jsonLoad, _ := json.Marshal(g)
	orchURL := "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName
	url := orchURL + "/generic-placement-intents"
	resp, err := orch.apiPost(jsonLoad, url, gPintName)
	return resp, err
}

func (h *localStoreIntentHandler) deleteAppPIntent(appIntentName string, p string, ca string, v string,
	gpintName string, digName string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewAppIntentClient()
	deleteErr := c.DeleteAppIntent(appIntentName, p, ca, v, gpintName, digName)
	if deleteErr != nil {
		log.Error(deleteErr.Error(), log.Fields{})
		if strings.Contains(deleteErr.Error(), "not found") {
			return http.StatusNotFound, deleteErr
		} else if strings.Contains(deleteErr.Error(), "conflict") {
			return http.StatusConflict, deleteErr
		} else {
			return http.StatusInternalServerError, deleteErr
		}
	}
	return http.StatusNoContent, deleteErr
}

func (h *remoteStoreIntentHandler) deleteAppPIntent(appIntentName string, p string, ca string, v string,
	gpintName string, digName string) (interface{}, interface{}) {

	orch := h.orchInstance
	orchURL := "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName
	url := orchURL + "/generic-placement-intents/" + gpintName + "/app-intents/" + appIntentName
	status, err := orch.apiDel(url, gpintName)
	return status, err
}

func (h *localStoreIntentHandler) deleteGpint(gpintName string, p string, ca string,
	v string, digName string) (interface{}, interface{}) {
	c := localstore.NewGenericPlacementIntentClient()

	err := c.DeleteGenericPlacementIntent(gpintName, p, ca, v, digName)
	if err != nil {
		log.Error(err.Error(), log.Fields{})
		if strings.Contains(err.Error(), "not found") {
			return http.StatusNotFound, err
		} else if strings.Contains(err.Error(), "conflict") {
			return http.StatusConflict, err
		} else {
			return http.StatusInternalServerError, err
		}
	}

	return http.StatusNoContent, nil
}

func (h *remoteStoreIntentHandler) deleteGpint(gpintName string, p string, ca string,
	v string, digName string) (interface{}, interface{}) {
	orch := h.orchInstance
	orchURL := "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName + "/generic-placement-intents/" + gpintName
	resp, err := orch.apiDel(orchURL, gpintName)
	return resp, err
}

func (h *localStoreIntentHandler) createAppPIntent(pint localstore.AppIntent, p string, ca string, v string,
	digName string, gpintName string) (interface{}, interface{}) {
	// Get the local store handler.
	c := localstore.NewAppIntentClient()
	_, createErr := c.CreateAppIntent(pint, p, ca, v, gpintName, digName)
	if createErr != nil {
		log.Error(createErr.Error(), log.Fields{})
		if strings.Contains(createErr.Error(), "Unable to find the project") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "Unable to find the composite-app") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "Unable to find the intent") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "Unable to find the deployment-intent-group-name") {
			return http.StatusNotFound, createErr
		} else if strings.Contains(createErr.Error(), "AppIntent already exists") {
			return http.StatusConflict, createErr
		} else {
			return http.StatusInternalServerError, createErr
		}
	}
	return http.StatusCreated, createErr
}

func (h *remoteStoreIntentHandler) createAppPIntent(pint localstore.AppIntent, p string, ca string, v string,
	digName string, gpintName string) (interface{}, interface{}) {
	orch := h.orchInstance
	jsonLoad, _ := json.Marshal(pint)
	orchURL := "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" + p +
		"/composite-apps/" + ca + "/" + v +
		"/deployment-intent-groups/" + digName
	url := orchURL + "/generic-placement-intents/" + gpintName + "/app-intents"
	status, err := orch.apiPost(jsonLoad, url, ca+"_gpint")
	return status, err
}

func (h *placementIntentHandler) getObject() (interface{}, interface{}) {
	orch := h.orchInstance
	vars := orch.Vars
	retcode := 200
	dataRead := h.orchInstance.dataRead
	project := vars["project-name"]
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		Apps := compositeAppValue.AppsDataArray
		for digName, digValue := range Dig {
			for gpintName, gpintValue := range digValue.GpintMap {
				for appName, _ := range Apps {
					var appPint localstore.AppIntent
					retcode, retval, err := orch.bstore.getAppPIntent(appName+"_pint", gpintName,
						project, compositeAppMetadata.Name, compositeAppSpec.Version, digName)
					log.Infof("Get Gpint App intent in Composite app %s dig %s Gpint %s status: %d",
						vars["composite-app-name"], digName, gpintName, retcode)
					if err != nil {
						log.Error("Failed to read app pint\n")
						return nil, 500
					}
					if retcode != 200 {
						log.Error("Failed to read app pint\n")
						return nil, 200
					}
					err = json.Unmarshal(retval, &appPint)
					if err != nil {
						log.Errorf("Failed to unmarshal json %s\n", err)
						return nil, 500
					}
					gpintValue.AppIntentArray = append(gpintValue.AppIntentArray, appPint)
				}
			}
		}
	}
	return nil, retcode
}

func (h *placementIntentHandler) getAnchor() (interface{}, interface{}) {
	orch := h.orchInstance
	vars := orch.Vars
	retcode := 200

	dataRead := h.orchInstance.dataRead
	project := vars["project-name"]

	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		for digName, digValue := range Dig {
			var gpintList []localstore.GenericPlacementIntent
			retcode, retval, err := orch.bstore.getAllGPint(project, compositeAppMetadata.Name,
				compositeAppSpec.Version, digName)
			log.Infof("Get Gpint in Composite app %s dig %s status: %d", vars["composite-app-name"],
				digName, retcode)
			if err != nil {
				log.Error("Failed to read gpint\n")
				return nil, 500
			}
			if retcode != 200 {
				log.Error("Failed to read gpint\n")
				return nil, retcode
			}
			json.Unmarshal(retval, &gpintList)
			digValue.GpintMap = make(map[string]*GpintData, len(gpintList))
			for _, value := range gpintList {
				var GpintDataInstance GpintData
				GpintDataInstance.Gpint = value
				digValue.GpintMap[value.MetaData.Name] = &GpintDataInstance
			}
		}
	}
	return nil, retcode
}

func (h *placementIntentHandler) deleteObject() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		Apps := compositeAppValue.AppsDataArray

		// loop through all app intens in the gpint
		for digName, digValue := range Dig {
			for gpintName, _ := range digValue.GpintMap {
				for appName, _ := range Apps {
					// query based on app name.
					resp, err := orch.bstore.deleteAppPIntent(appName+"_pint", vars["project-name"],
							compositeAppMetadata.Name, compositeAppSpec.Version, gpintName, digName)
					if err != nil {
						return err
					}
					if resp != 204 {
						return resp
					}
					log.Infof("Delete gpint intents response: %d", resp)
				}
			}
		}
	}
	return nil
}

func (h placementIntentHandler) deleteAnchor() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap

		// loop through all app intens in the gpint
		for digName, digValue := range Dig {
			for gpintName, _ := range digValue.GpintMap {
				log.Infof("Delete gpint  %s", h.orchURL)
				resp, err := orch.bstore.deleteGpint(gpintName, vars["project-name"],
					compositeAppMetadata.Name, compositeAppSpec.Version, digName)
				if err != nil {
					return err
				}
				if resp != 204 {
					return resp
				}
				log.Infof("Delete gpint response: %d", resp)
			}
		}
	}
	return nil
}

func (h *placementIntentHandler) createAnchor() interface{} {
	orch := h.orchInstance
	intentData := h.orchInstance.DigData
	gPintName := intentData.CompositeAppName + "_gpint"

	vars := orch.Vars
	projectName := vars["project-name"]
	compositeAppName := vars["composite-app-name"]
	version := vars["version"]
	digName := intentData.Name

	gpi := localstore.GenericPlacementIntent{
		MetaData: localstore.GenIntentMetaData{
			Name:        gPintName,
			Description: "Generic placement intent created from middleend",
			UserData1:   "data 1",
			UserData2:   "data2"},
	}

	// POST the generic placement intent
	resp, err := orch.bstore.createGpint(gpi, projectName, compositeAppName, version, digName)
	jsonLoad, _ := json.Marshal(gpi)
	orch.response.payload[compositeAppName+"_gpint"] = jsonLoad
	orch.response.status[compositeAppName+"_gpint"] = resp.(int)
	if err != nil {
		return err
	}
	if resp != 201 {
		return resp
	}
	log.Infof("Generic placement intent response: %d", resp)

	return nil
}

func (h *placementIntentHandler) createObject() interface{} {
	orch := h.orchInstance
	intentData := h.orchInstance.DigData
	vars := orch.Vars
	projectName := vars["project-name"]
	compositeAppName := vars["composite-app-name"]
	version := vars["version"]
	digName := vars["deployment-intent-group-name"]

	for _, app := range intentData.Spec.Apps {
		appName := app.Metadata.Name
		intentName := appName + "_pint"
		genericAppIntentName := compositeAppName + "_gpint"

		// Initialize the base structure and then add the cluster values,
		// we support only allof for now.
		var customData string
		if orch.Vars["update-intent"] == "yes" {
			customData = "updated"
		} else {
			customData = "data 1"
		}
		pint := localstore.AppIntent{
			MetaData: localstore.MetaData{
				Name:        intentName,
				Description: "NA",
				UserData1:   customData,
				UserData2:   "data2"},
			Spec: localstore.SpecData{
				AppName: appName,
				Intent:  localstore.IntentStruc{},
			},
		}

		for _, clusterProvider := range app.Clusters {
			if len(clusterProvider.SelectedClusters) > 0 {
				for _, cluster := range clusterProvider.SelectedClusters {
					if app.PlacementCriterion == "allOf" {
						allOfClusters := localstore.AllOf{}
						allOfClusters.ProviderName = clusterProvider.Provider
						allOfClusters.ClusterName = cluster.Name
						pint.Spec.Intent.AllOfArray = append(pint.Spec.Intent.AllOfArray, allOfClusters)
					} else {
						anyOfClusters := localstore.AnyOf{}
						anyOfClusters.ProviderName = clusterProvider.Provider
						anyOfClusters.ClusterName = cluster.Name
						pint.Spec.Intent.AnyOfArray = append(pint.Spec.Intent.AnyOfArray, anyOfClusters)
					}
				}
			}else {
				for _, label := range clusterProvider.SelectedLabels {
					if app.PlacementCriterion == "allOf" {
						allOfClusters := localstore.AllOf{}
						allOfClusters.ProviderName = clusterProvider.Provider
						allOfClusters.ClusterLabelName = label.Name
						pint.Spec.Intent.AllOfArray = append(pint.Spec.Intent.AllOfArray, allOfClusters)
					} else {
						anyOfClusters := localstore.AnyOf{}
						anyOfClusters.ProviderName = clusterProvider.Provider
						anyOfClusters.ClusterLabelName = label.Name
						pint.Spec.Intent.AnyOfArray = append(pint.Spec.Intent.AnyOfArray, anyOfClusters)
					}
				}
			}
		}
		log.Debugf("pint is: %+v",pint)
		status, err := orch.bstore.createAppPIntent(pint, projectName, compositeAppName, version, digName, genericAppIntentName)
		jsonLoad, _ := json.Marshal(pint)
		orch.response.payload[genericAppIntentName] = jsonLoad
		orch.response.status[genericAppIntentName] = status.(int)
		if err != nil {
			log.Fatalln(err)
		}
		if status != 201 {
			return status
		}
		log.Infof("Placement intent %s status: %d", intentName, status)
	}
	return nil
}

func addPlacementIntent(I orchWorkflow) interface{} {
	// 1. Create the Anchor point
	err := I.createAnchor()
	if err != nil {
		return err
	}
	// 2. Create the Objects
	err = I.createObject()
	if err != nil {
		return err
	}
	return nil
}

func delGpint(I orchWorkflow) interface{} {
	// 1. Create the Anchor point
	err := I.deleteObject()
	if err != nil {
		return err
	}
	// 2. Create the Objects
	err = I.deleteAnchor()
	if err != nil {
		return err
	}
	return nil
}

func (h *networkIntentHandler) createAnchor() interface{} {
	orch := h.orchInstance
	intentData := h.orchInstance.DigData

	nwCtlIntentName := intentData.CompositeAppName + "_nwctlint"

	nwIntent := localstore.NetControlIntent{
		Metadata: localstore.Metadata{
			Name:        nwCtlIntentName,
			Description: "Network Controller created from middleend",
			UserData1:   "data 1",
			UserData2:   "data2"},
	}
	resp, err := orch.bstore.createControllerIntent(nwIntent, intentData.Spec.ProjectName, intentData.CompositeAppName,
		intentData.CompositeAppVersion, intentData.Name, false, nwCtlIntentName)
	jsonLoad, _ := json.Marshal(nwIntent)
	orch.response.payload[nwCtlIntentName] = jsonLoad
	orch.response.status[nwCtlIntentName] = resp.(int)
	if err != nil {
		return err
	}
	if resp != 201 {
		return resp
	}
	log.Infof("Network controller intent response: %d", resp)

	return nil
}

func (h *networkIntentHandler) createObject() interface{} {
	orch := h.orchInstance
	intentData := h.orchInstance.DigData
	vars := orch.Vars
	projectName := vars["project-name"]
	compositeAppName := vars["composite-app-name"]
	version := vars["version"]
	genericAppIntentName := compositeAppName + "_nwctlint"
	digName := vars["deployment-intent-group-name"]

	for _, app := range intentData.Spec.Apps {
		// Check if the application has any interfaces.
		// There is assumption that if an application must have same interfaces
		// specified in each cluster.
		if len(app.Interfaces) == 0 {
			continue
		}

		appName := app.Metadata.Name
		workloadIntentName := appName + "_wlint"

		var customData string
		if orch.Vars["update-intent"] == "yes" {
			customData = "updated"
		} else {
			customData = "data 1"
		}

		wlIntent := localstore.WorkloadIntent{
			Metadata: localstore.Metadata{
				Name:        workloadIntentName,
				Description: "NA",
				UserData1:   customData,
				UserData2:   "data2"},
			Spec: localstore.WorkloadIntentSpec{
				AppName:          appName,
				WorkloadResource: intentData.DigVersion + "-" + appName,
				Type:             "Deployment",
			},
		}

		status, err := orch.bstore.createWorkloadIntent(wlIntent, projectName, compositeAppName,
			version, digName, genericAppIntentName, false, workloadIntentName)
		jsonLoad, _ := json.Marshal(wlIntent)
		orch.response.payload[workloadIntentName] = jsonLoad
		orch.response.status[workloadIntentName] = status.(int)
		if err != nil {
			log.Fatalln(err)
		}
		if status != 201 {
			return status
		}
		log.Infof("Workload intent %s status: %d", workloadIntentName, status)

		// Create interfaces for each per app workload intent.
		for i, iface := range app.Interfaces {
			interfaceNum := strconv.Itoa(i)
			interfaceName := app.Metadata.Name + "_interface" + interfaceNum

			nwiface := localstore.WorkloadIfIntent{
				Metadata: localstore.Metadata{
					Name:        interfaceName,
					Description: "NA",
					UserData1:   "data1",
					UserData2:   "data2"},
				Spec: localstore.WorkloadIfIntentSpec{
					IfName:         "net" + interfaceNum,
					NetworkName:    iface.NetworkName,
					DefaultGateway: "false",
					IpAddr:         iface.IP,
				},
			}

			status, err := orch.bstore.createWorkloadIfIntent(nwiface, projectName, compositeAppName,
				version, digName, genericAppIntentName, workloadIntentName, false, interfaceName)
			jsonLoad, _ := json.Marshal(nwiface)
			orch.response.payload[interfaceName] = jsonLoad
			orch.response.status[interfaceName] = status.(int)
			if err != nil {
				log.Fatalln(err)
			}
			if status != 201 {
				return status
			}
			log.Infof("interface %s status: %d ", interfaceName, status)
		}
	}

	return nil
}

func (h *networkIntentHandler) getObject() (interface{}, interface{}) {
	orch := h.orchInstance
	vars := orch.Vars
	projectName := vars["project-name"]
	compositeAppName := vars["composite-app-name"]
	retcode := 200
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		for digName, digValue := range Dig {
			for nwintName, nwintValue := range digValue.NwintMap {
				var wrlintList []NetworkWlIntent
				retcode, retval, err := orch.bstore.getWorkloadIntents(projectName, compositeAppMetadata.Name,
					compositeAppSpec.Version, digName, nwintName)
				log.Infof("Get Wrkld intents in Composite app %s dig %s nw intent %s status: %d",
					compositeAppName, digName, nwintName, retcode)
				if err != nil {
					log.Error("Failed to read nw  workload int")
					return nil, 500
				}
				if retcode != 200 {
					log.Error("Failed to read nw  workload int")
					return nil, retcode
				}
				json.Unmarshal(retval, &wrlintList)
				nwintValue.WrkintMap = make(map[string]*WrkintData, len(wrlintList))
				for _, wrlIntValue := range wrlintList {
					var WrkintDataInstance WrkintData
					WrkintDataInstance.Wrkint = wrlIntValue

					var ifaceList []NwInterface
					log.Infof("Get interface in Composite app %s dig %s nw intent %s wrkld intent %s status: %d",
						compositeAppName, digName, nwintName, wrlIntValue.Metadata.Name, retcode)
					retcode, retval, err := orch.bstore.getWorkloadIfIntents(projectName, compositeAppMetadata.Name,
						compositeAppSpec.Version, digName, nwintName, wrlIntValue.Metadata.Name)
					if err != nil {
						log.Error("Failed to read nw interface")
						return nil, 500
					}
					if retcode != 200 {
						log.Error("Failed to read nw interface")
						return nil, retcode
					}
					json.Unmarshal(retval, &ifaceList)
					WrkintDataInstance.Interfaces = ifaceList
					nwintValue.WrkintMap[wrlIntValue.Metadata.Name] = &WrkintDataInstance
				}
			}
		}
	}
	return nil, retcode
}

func (h *networkIntentHandler) getAnchor() (interface{}, interface{}) {
	orch := h.orchInstance
	vars := orch.Vars
	projectName := vars["project-name"]
	compositeAppName := vars["composite-app-name"]
	retcode := 200
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		for digName, digValue := range Dig {
			var nwintList []NetworkCtlIntent

			retcode, retval, err := orch.bstore.getControllerIntents(projectName, compositeAppMetadata.Name, compositeAppSpec.Version, digName)
			log.Infof("Get Network Ctl intent in Composite app %s dig %s status: %d",
				compositeAppName, digName, retcode)
			if err != nil {
				log.Errorf("Failed to read nw int %s\n", err)
				return nil, 500
			}
			if retcode != 200 {
				log.Error("Failed to read nw int")
				return nil, retcode
			}
			json.Unmarshal(retval, &nwintList)
			digValue.NwintMap = make(map[string]*NwintData, len(nwintList))
			for _, nwIntValue := range nwintList {
				var NwintDataInstance NwintData
				NwintDataInstance.Nwint = nwIntValue
				digValue.NwintMap[nwIntValue.Metadata.Name] = &NwintDataInstance
			}
		}
	}
	return nil, retcode
}

func (h *networkIntentHandler) deleteObject() interface{} {
	orch := h.orchInstance
	retcode := 200
	vars := orch.Vars
	projectName := vars["project-name"]
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		for digName, digValue := range Dig {
			h.ovnURL = "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" +
				projectName + "/composite-apps/" + compositeAppMetadata.Name +
				"/" + compositeAppSpec.Version +
				"/deployment-intent-groups/" + digName

			for nwintName, nwintValue := range digValue.NwintMap {
				for wrkintName, wrkintValue := range nwintValue.WrkintMap {
					// Delete the interfaces per workload intent.
					for _, value := range wrkintValue.Interfaces {
						retcode, err := orch.bstore.deleteWorkloadIfIntent(value.Metadata.Name, wrkintName,
							projectName, compositeAppMetadata.Name,
							compositeAppSpec.Version, digName, nwintName)
						if err != nil {
							return err
						}
						if retcode != 204 {
							return retcode
						}
						log.Infof("Delete nw interface response: %d", retcode)
					}
					// Delete the workload intents.
					url := h.ovnURL + "network-controller-intent/" + nwintName + "/workload-intents/" + wrkintName
					log.Infof("Delete app nw wl intent %s", url)
					retcode, err := orch.bstore.deleteWorkloadIntent(wrkintName, projectName, compositeAppMetadata.Name,
						compositeAppSpec.Version, digName, nwintName)
					log.Infof("Delete nw wl intent response: %d", retcode)
					if err != nil {
						return err
					}
					if retcode != 204 {
						return retcode
					}
				} // For workload intents in network controller intent.
			} // For network controller intents in Dig.
		} // For Dig.
	} // For composite app.
	return retcode
}

func (h networkIntentHandler) deleteAnchor() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	projectName := vars["project-name"]
	retcode := 200
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		Dig := compositeAppValue.DigMap
		for digName, digValue := range Dig {
			h.ovnURL = "http://" + orch.MiddleendConf.OvnService + "/v2/projects/" +
				projectName + "/composite-apps/" + compositeAppMetadata.Name +
				"/" + compositeAppSpec.Version +
				"/deployment-intent-groups/" + digName
			for nwintName, _ := range digValue.NwintMap {
				// loop through all app intens in the gpint
				retcode, err := orch.bstore.deleteControllerIntent(nwintName, projectName, compositeAppMetadata.Name,
					compositeAppSpec.Version, digName)
				log.Infof("Delete nw controller intent response: %d", retcode)
				if err != nil {
					return err
				}
				if retcode != 204 {
					return retcode
				}
			}
		}
	}
	return retcode
}

func addNetworkIntent(I orchWorkflow) interface{} {
	//1. Add network controller Intent
	err := I.createAnchor()
	if err != nil {
		return err
	}

	//2. Add network workload intent
	err = I.createObject()
	if err != nil {
		return err
	}

	return nil
}

func delNwintData(I orchWorkflow) interface{} {
	// 1. Create the Anchor point
	err := I.deleteObject()
	if err != nil {
		return err
	}
	// 2. Create the Objects
	err = I.deleteAnchor()
	if err != nil {
		return err
	}
	return nil
}
