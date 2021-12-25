package app

import (
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
	"time"

	"example.com/middleend/localstore"
	log "github.com/sirupsen/logrus"
	//deepcopy "github.com/barkimedes/go-deepcopy"
)

type digActions struct {
	State    string    `json:"state"`
	Instance string    `json:"instance"`
	Time     time.Time `json:"time"`
}
type digStatus struct {
	Project              string `json:"project"`
	CompositeAppName     string `json:"composite-app-name"`
	CompositeAppVersion  string `json:"composite-app-version"`
	CompositeProfileName string `json:"composite-profile-name"`
	Name                 string `json:"name"`
	States               struct {
		Actions []digActions `json:"actions"`
	} `json:"states"`
	Status      string `json:"status,omitempty"`
	RsyncStatus struct {
		Deleted int `json:"Deleted,omitempty"`
	} `json:"rsync-status,omitempty"`
	Apps []AppsStatus `json:"apps,omitempty"`
	IsCheckedOut bool `json:"is_checked_out"`
	TargetVersion string  `json:"targetVersion"`
}

type AppsStatus struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Clusters    []struct {
		ClusterProvider string        `json:"cluster-provider"`
		Cluster         string        `json:"cluster"`
		Interfaces      []NwInterface `json:"interfaces,omitempty"`
		Resources       []struct {
			GVK struct {
				Group   string `json:"Group"`
				Version string `json:"Version"`
				Kind    string `json:"Kind"`
			} `json:"GVK"`
			Name        string `json:"name"`
			RsyncStatus string `json:"rsync-status"`
		} `json:"resources"`
	} `json:"clusters"`
}

type guiDigView struct {
	Name                 string               `json:"name"`
	CompositeAppName     string               `json:"composite-app-name"`
	CompositeAppVersion  string               `json:"composite-app-version"`
	CompositeProfileName string               `json:"composite-profile-name"`
	Logicalcloud         string               `json:"logicalCloud"`
	Status               string               `json:"status,omitempty"`
	Apps                 []appsInCompositeApp `json:"apps"`
}

type appsInCompositeApp struct {
	Name               string                      `json:"name"`
	Description        string                      `json:"description"`
	PlacementCriterion string                      `json:"placementCriterion"`
	Interfaces         []NwInterface               `json:"interfaces"`
	Clusters           []ClustersInPlacementIntent `json:"clusters"`
}

type ClustersInPlacementIntent struct {
	ClusterProvider    string `json:"clusterProvider"`
	SelectedCluster    []struct {
		Name string `json:"name"`
	} `json:"selectedClusters"`
	SelectedLabels []SelectedLabel `json:"selectedLabels"`
}

func (h *OrchestrationHandler) getData(I orchWorkflow) (interface{}, interface{}) {
	_, retcode := I.getAnchor()
	if retcode != http.StatusOK {
		return nil, retcode
	}
	dataPointData, retcode := I.getObject()
	if retcode != http.StatusOK {
		return nil, retcode
	}
	return dataPointData, retcode
}

func (h *OrchestrationHandler) deleteData(I orchWorkflow) (interface{}, interface{}) {
	_ = I.deleteObject()
	_ = I.deleteAnchor()
	return nil, http.StatusNoContent //FIXME
}

func (h *OrchestrationHandler) deleteTree(dataPoints []string) interface{} {
	//1. Fetch App data
	var I orchWorkflow
	for _, dataPoint := range dataPoints {
		switch dataPoint {
		case "projectHandler":
			temp := &projectHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.deleteData(I)
			if retcode != http.StatusNoContent {
				return retcode
			}
		case "compAppHandler":
			temp := &compAppHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.deleteData(I)
			if retcode != http.StatusNoContent {
				return retcode
			}
		case "ProfileHandler":
			temp := &ProfileHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.deleteData(I)
			if retcode != http.StatusNoContent {
				return retcode
			}
		case "digpHandler":
			temp := &digpHandler{}
			temp.orchInstance = h
			I = temp
			log.Infof("delete digp")
			_, retcode := h.deleteData(I)
			if retcode != http.StatusNoContent {
				return retcode
			}
		case "placementIntentHandler":
			temp := &placementIntentHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.deleteData(I)
			if retcode != http.StatusNoContent {
				return retcode
			}
		case "networkIntentHandler":
			temp := &networkIntentHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.deleteData(I)
			if retcode != http.StatusNoContent {
				return retcode
			}
		default:
			log.Infof("%s", dataPoint)
		}
	}
	return nil
}

func (h *OrchestrationHandler) constructTree(dataPoints []string) interface{} {
	//1. Fetch App data
	var I orchWorkflow
	for _, dataPoint := range dataPoints {
		switch dataPoint {
		case "projectHandler":
			temp := &projectHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.getData(I)
			if retcode != http.StatusOK {
				return retcode
			}
		case "compAppHandler":
			temp := &compAppHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.getData(I)
			if retcode != http.StatusOK {
				return retcode
			}
		case "ProfileHandler":
			temp := &ProfileHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.getData(I)
			if retcode != http.StatusOK {
				return retcode
			}
		case "digpHandler":
			temp := &digpHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.getData(I)
			if retcode != http.StatusOK {
				return retcode
			}
		case "placementIntentHandler":
			temp := &placementIntentHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.getData(I)
			if retcode != http.StatusOK {
				return retcode
			}
		case "networkIntentHandler":
			temp := &networkIntentHandler{}
			temp.orchInstance = h
			I = temp
			_, retcode := h.getData(I)
			if retcode != http.StatusOK {
				return retcode
			}
		default:
			log.Infof("%s\n", dataPoint)
		}
	}
	return nil
}

func (h *OrchestrationHandler) copyNwToStatus() {
	dataRead := h.dataRead
	var localAppInterfaceMap map[string][]NwInterface
	var localAppDescMap map[string]string
	// Get the network interface per app
	for compositeAppName := range dataRead.compositeAppMap {
		for _, digValue := range dataRead.compositeAppMap[compositeAppName].DigMap {

			// Populate the Nwint intents
			SourceNwintMap := digValue.NwintMap
			for _, nwintValue := range SourceNwintMap {
				localAppInterfaceMap = make(map[string][]NwInterface, len(nwintValue.WrkintMap))
				for _, wrkintValue := range nwintValue.WrkintMap {
					localAppInterfaceMap[wrkintValue.Wrkint.Spec.AppName] = wrkintValue.Interfaces
				}
			}
		}
	}
	// Get the app description per app
	for compositeAppName := range dataRead.compositeAppMap {
		localAppDescMap = make(map[string]string, len(dataRead.compositeAppMap[compositeAppName].AppsDataArray))
		for appName, appValue := range dataRead.compositeAppMap[compositeAppName].AppsDataArray {
			localAppDescMap[appName] = appValue.App.Metadata.Description
		}
	}

	// Now copy the interface to the respective application index in the status array
	for k, v := range h.DigStatusJSON.Apps {
		for i := range v.Clusters {
			h.DigStatusJSON.Apps[k].Clusters[i].Interfaces = localAppInterfaceMap[v.Name]
		}
		h.DigStatusJSON.Apps[k].Description = localAppDescMap[v.Name]
		log.Infof("App name %s desc %s", v.Description, localAppDescMap[v.Name])
	}
}

func (h *OrchestrationHandler) copyCompositeAppTree(filter string) {
	dataRead := h.dataRead
	h.CompositeAppReturnJSON = nil

	for compositeAppName := range dataRead.compositeAppMap {
		compositeApp := CompositeAppsInProject{}
		compositeApp.Metadata = dataRead.compositeAppMap[compositeAppName].Metadata.Metadata
		compositeApp.Status = dataRead.compositeAppMap[compositeAppName].Status
		compositeApp.Spec.Version = dataRead.compositeAppMap[compositeAppName].Metadata.Spec.Version
		if filter == "depthAll" {
			for _, profileValue := range dataRead.compositeAppMap[compositeAppName].ProfileDataArray {
				profile := &Profiles{}
				profile.Metadata = profileValue.Profile.Metadata
				profile.Spec.ProfilesArray = profileValue.AppProfiles
				compositeApp.Spec.ProfileArray = append(compositeApp.Spec.ProfileArray, profile)
			}
			for _, appValue := range dataRead.compositeAppMap[compositeAppName].AppsDataArray {
				compositeApp.Spec.AppsArray = append(compositeApp.Spec.AppsArray, &appValue.App)
			}
			for _, digValue := range dataRead.compositeAppMap[compositeAppName].DigMap {
				dig := &localstore.DeploymentIntentGroup{}
				dig = &digValue.DigpData
				compositeApp.Spec.DigArray = append(compositeApp.Spec.DigArray, dig)
			}
		}
		h.CompositeAppReturnJSON = append(h.CompositeAppReturnJSON, compositeApp)
	}
}

func (h *OrchestrationHandler) createJSONResponse(filter string, status string) {
	dataRead := h.dataRead
	h.CompositeAppReturnJSONShrunk = nil

	for compositeAppName := range dataRead.compositeAppMap {
		//if status is passed as query params then filter on status
		if status != "" && dataRead.compositeAppMap[compositeAppName].Status != status {
			continue
		}
		var tempSpec CompositeAppSpec
		var ca CompositeAppsInProjectShrunk
		tempSpec.Status = dataRead.compositeAppMap[compositeAppName].Status
		tempSpec.Version = dataRead.compositeAppMap[compositeAppName].Metadata.Spec.Version

		if filter == "depthAll" {
			for _, profileValue := range dataRead.compositeAppMap[compositeAppName].ProfileDataArray {
				profile := &Profiles{}
				profile.Metadata = profileValue.Profile.Metadata
				profile.Spec.ProfilesArray = profileValue.AppProfiles
				tempSpec.ProfileArray = append(tempSpec.ProfileArray, profile)
			}
			for _, appValue := range dataRead.compositeAppMap[compositeAppName].AppsDataArray {
				app := &Application{}
				app = &appValue.App
				tempSpec.AppsArray = append(tempSpec.AppsArray, app)
			}
			for _, digValue := range dataRead.compositeAppMap[compositeAppName].DigMap {
				dig := &localstore.DeploymentIntentGroup{}
				dig = &digValue.DigpData
				tempSpec.DigArray = append(tempSpec.DigArray, dig)
			}
		}

		if h.CompositeAppReturnJSONShrunk != nil {
			for index, compositeApp := range h.CompositeAppReturnJSONShrunk {
				if compositeApp.Metadata.Name == dataRead.compositeAppMap[compositeAppName].Metadata.Metadata.Name {
					tempCAIPS := compositeApp.Spec
					h.CompositeAppReturnJSONShrunk[index].Spec = append(tempCAIPS, tempSpec)
					break
				} else if index == (len(h.CompositeAppReturnJSONShrunk) - 1) {
					ca.Metadata = dataRead.compositeAppMap[compositeAppName].Metadata.Metadata
					ca.Spec = append(ca.Spec, tempSpec)
					h.CompositeAppReturnJSONShrunk = append(h.CompositeAppReturnJSONShrunk, ca)
				}
			}
		} else {
			ca.Metadata = dataRead.compositeAppMap[compositeAppName].Metadata.Metadata
			ca.Spec = append(ca.Spec, tempSpec)
			h.CompositeAppReturnJSONShrunk = append(h.CompositeAppReturnJSONShrunk, ca)
		}
	}
}

func (h *OrchestrationHandler) copyDigTreeNew() {
	dataRead := h.dataRead
	localGuiDigView := guiDigView{}

	for compositeAppName, value := range dataRead.compositeAppMap {
		for _, digValue := range dataRead.compositeAppMap[compositeAppName].DigMap {

			digMetadata := digValue.DigpData.MetaData
			digSpec := digValue.DigpData.Spec

			// Copy the metadata
			localGuiDigView.Name = digMetadata.Name
			localGuiDigView.CompositeAppVersion = value.Metadata.Spec.Version
			localGuiDigView.CompositeAppName = value.Metadata.Metadata.Name
			localGuiDigView.CompositeProfileName = digSpec.Profile
			localGuiDigView.Logicalcloud = digSpec.LogicalCloud
			localGuiDigView.Status = digSpec.Status

			// Interate over all the applications in the composite application
			// and allocate the guiDigView.Apps array
			apps := value.AppsDataArray
			localApps := make(map[string]*appsInCompositeApp)
			for _, application := range apps {
				guiDigViewApp := appsInCompositeApp{}
				guiDigViewApp.Name = application.App.Metadata.Name
				guiDigViewApp.Description = application.App.Metadata.Description
				localApps[guiDigViewApp.Name] = &guiDigViewApp
			}
			log.Infof("%d Applications in composite application %s\n", len(localApps), value.Metadata.Metadata.Name)

			// Populate the cluster information in the guiDigView.Apps
			genericPlacementIntents := digValue.GpintMap
			for genericPlacementIntentName, genericPlacementIntent := range genericPlacementIntents {
				for _, appGenericPlacementIntent := range genericPlacementIntent.AppIntentArray {
					appName := appGenericPlacementIntent.Spec.AppName
					guiDigViewApp := localApps[appName]
					log.Infof("Copying the generic placement intent %s application %s\n",
					genericPlacementIntentName, appName)

					// Iterate through all the clusters
					selectedClusterProviders := make(map[string][]string)
					selectedLabelProviders := make(map[string][]string)
					for _, allof := range appGenericPlacementIntent.Spec.Intent.AllOfArray {
						if len(allof.ClusterName) > 0 {
							selectedClusterProviders[allof.ProviderName] = append(selectedClusterProviders[allof.ProviderName], allof.ClusterName)
						}
						if len(allof.ClusterLabelName) > 0 {
							selectedLabelProviders[allof.ProviderName] = append(selectedLabelProviders[allof.ProviderName], allof.ClusterLabelName)
						}
						localApps[appName].PlacementCriterion = "allOf"
					}

					for _, anyof := range appGenericPlacementIntent.Spec.Intent.AnyOfArray {
						if len(anyof.ClusterName) > 0 {
							selectedClusterProviders[anyof.ProviderName] = append(selectedClusterProviders[anyof.ProviderName], anyof.ClusterName)
						}
						if len(anyof.ClusterLabelName) > 0 {
							selectedLabelProviders[anyof.ProviderName] = append(selectedLabelProviders[anyof.ProviderName], anyof.ClusterLabelName)
						}
						localApps[appName].PlacementCriterion = "anyOf"
					}

					log.Debugf("selectedClusterProviders: %+v", selectedClusterProviders)
					log.Debugf("selectedLabelProviders: %+v", selectedLabelProviders)

					for clusterProvider, clusterArray := range selectedClusterProviders {
						clusterIntent := ClustersInPlacementIntent{}
						clusterIntent.ClusterProvider = clusterProvider
						clusterIntent.SelectedCluster = make([]struct {
							Name string "json:\"name\""
						}, len(clusterArray))

						for k, v := range clusterArray {
							if len(v) > 0 {
								clusterIntent.SelectedCluster[k].Name = v
							}
						}
						guiDigViewApp.Clusters = append(guiDigViewApp.Clusters, clusterIntent)
					}

					for clusterProvider, clusterArray := range selectedLabelProviders {
						clusterIntent := ClustersInPlacementIntent{}
						clusterIntent.ClusterProvider = clusterProvider
						clusterIntent.SelectedLabels = make([] SelectedLabel, len(clusterArray))

						for k, v := range clusterArray {
							if len(v) > 0 {
								clusterIntent.SelectedLabels[k].Name = v
							}
						}
						guiDigViewApp.Clusters = append(guiDigViewApp.Clusters, clusterIntent)
					}
				}
			}

			// Fetch subnets info for networks and provider networks
			nwhandler := ncmHandler{}
			nwhandler.orchInstance = h
			var conStatus ConsolidatedStatus
			var appName string
			for _, app := range apps {
				appName = app.App.Metadata.Name
			}

			h.Vars["clusterprovider-name"] = localApps[appName].Clusters[0].ClusterProvider
			if len(localApps[apps[appName].App.Metadata.Name].Clusters[0].SelectedCluster) > 0 {
				h.Vars["cluster-name"] = localApps[apps[appName].App.Metadata.Name].Clusters[0].SelectedCluster[0].Name
			} else {
				var clusterNames []string
				label := localApps[apps[appName].App.Metadata.Name].Clusters[0].SelectedLabels[0].Name
				url := "http://" + h.MiddleendConf.Clm + "/v2/cluster-providers/" +
					h.Vars["clusterprovider-name"] + "/clusters?label=" + label

				retcode, respval, err := h.apiGet(url, h.Vars["clusterprovider-name"])
				log.Infof("Get cluster name : %d", retcode)
				if err != nil {
					log.Errorf("Failed to get cluster name for label %s: ", label)
				}
				if retcode != http.StatusOK {
					log.Errorf("Failed to get cluster name for label %s: ", label)
				}
				json.Unmarshal(respval, &clusterNames)
				h.Vars["cluster-name"] = clusterNames[0]
			}

			respdata, retcode := nwhandler.getNetworks()
			if retcode != nil {
				if intval, ok := retcode.(int); ok {
					log.Errorf("Failed to get cluster networks : %d", intval)
				}
			}
			conStatus = respdata.(ConsolidatedStatus)

			// Populate the the network interface in the app array
			networkIntents := digValue.NwintMap
			for _, nwintValue := range networkIntents {
				for _, workloadIntents := range nwintValue.WrkintMap {
					appName := workloadIntents.Wrkint.Spec.AppName
					guiDigViewApp := localApps[appName]

					guiDigViewApp.Interfaces = make([]NwInterface, len(workloadIntents.Interfaces))
					for i, nwinterface := range workloadIntents.Interfaces {
						for _, net := range conStatus.Spec.Networks {
							if net.Metadata.Name == nwinterface.Spec.Name {
								nwinterface.Spec.SubNet = net.Spec.Ipv4Subnets[0].Subnet
							}
						}
						for _, net := range conStatus.Spec.ProviderNetworks {
							if net.Metadata.Name == nwinterface.Spec.Name {
								nwinterface.Spec.SubNet = net.Spec.Ipv4Subnets[0].Subnet
							}
						}
						guiDigViewApp.Interfaces[i] = nwinterface
					}
				}
			}

			// Append all the apps to the guiDigView
			for _, app := range localApps {
				log.Infof("app %s\n", *app)
				localGuiDigView.Apps = append(localGuiDigView.Apps, *app)
			}
		}
		h.guiDigViewJSON = localGuiDigView
	}
}

// This function partest he compositeapp tree read and populates the
// Dig tree
func (h *OrchestrationHandler) copyDigTree() {
	dataRead := h.dataRead
	h.DigpReturnJSON = nil

	for compositeAppName, value := range dataRead.compositeAppMap {
		for _, digValue := range dataRead.compositeAppMap[compositeAppName].DigMap {
			// Ignore DIGs which are in updated state
			if digValue.DigpData.Spec.Status == "Updated" {
				continue
			}

			Dig := DigsInProject{}
			SourceDigMetadata := digValue.DigpData.MetaData

			// Copy the metadata
			Dig.Metadata.Name = SourceDigMetadata.Name
			Dig.Metadata.CompositeAppName = value.Metadata.Metadata.Name
			Dig.Metadata.CompositeAppVersion = value.Metadata.Spec.Version
			Dig.Metadata.Description = SourceDigMetadata.Description
			Dig.Metadata.UserData1 = SourceDigMetadata.UserData1
			Dig.Metadata.UserData2 = SourceDigMetadata.UserData2

			// Populate the Spec of dig
			SourceDigSpec := digValue.DigpData.Spec
			Dig.Spec.Status = digValue.DigpData.Spec.Status
			Dig.Spec.DigIntentsData = digValue.DigIntentsData.Intent
			Dig.Spec.Profile = SourceDigSpec.Profile
			Dig.Spec.Version = SourceDigSpec.Version
			Dig.Spec.Lcloud = SourceDigSpec.LogicalCloud
			Dig.Spec.OverrideValuesObj = SourceDigSpec.OverrideValuesObj
			Dig.Spec.IsCheckedOut = SourceDigSpec.IsCheckedOut

			// Pupolate the generic placement intents
			SourceGpintMap := digValue.GpintMap
			for t, gpintValue := range SourceGpintMap {
				log.Infof("gpName value %s", t)
				localGpint := DigsGpint{}
				localGpint.Metadata = gpintValue.Gpint.MetaData
				//localGpint.Spec.AppIntentArray = gpintValue.AppIntentArray
				localGpint.Spec.AppIntentArray = make([]PlacementIntentExport, len(gpintValue.AppIntentArray))
				for k := range gpintValue.AppIntentArray {
					localGpint.Spec.AppIntentArray[k].Metadata = gpintValue.AppIntentArray[k].MetaData
					localGpint.Spec.AppIntentArray[k].Spec.AppName =
						gpintValue.AppIntentArray[k].Spec.AppName
					localGpint.Spec.AppIntentArray[k].Spec.Intent.AllofCluster =
						make([]AllofExport, len(gpintValue.AppIntentArray[k].Spec.Intent.AllOfArray))
					for i := range gpintValue.AppIntentArray[k].Spec.Intent.AllOfArray {
						localGpint.Spec.AppIntentArray[k].Spec.Intent.AllofCluster[i].ProviderName =
							gpintValue.AppIntentArray[k].Spec.Intent.AllOfArray[i].ProviderName
						localGpint.Spec.AppIntentArray[k].Spec.Intent.AllofCluster[i].ClusterName =
							gpintValue.AppIntentArray[k].Spec.Intent.AllOfArray[i].ClusterName
						localGpint.Spec.AppIntentArray[k].Spec.Intent.AllofCluster[i].ClusterLabelName =
							gpintValue.AppIntentArray[k].Spec.Intent.AllOfArray[i].ClusterLabelName
					}

					localGpint.Spec.AppIntentArray[k].Spec.Intent.AnyofCluster =
						make([]AnyofExport, len(gpintValue.AppIntentArray[k].Spec.Intent.AnyOfArray))
					for i := range gpintValue.AppIntentArray[k].Spec.Intent.AnyOfArray {
						localGpint.Spec.AppIntentArray[k].Spec.Intent.AnyofCluster[i].ProviderName =
							gpintValue.AppIntentArray[k].Spec.Intent.AnyOfArray[i].ProviderName
						localGpint.Spec.AppIntentArray[k].Spec.Intent.AnyofCluster[i].ClusterName =
							gpintValue.AppIntentArray[k].Spec.Intent.AnyOfArray[i].ClusterName
						localGpint.Spec.AppIntentArray[k].Spec.Intent.AnyofCluster[i].ClusterLabelName =
							gpintValue.AppIntentArray[k].Spec.Intent.AnyOfArray[i].ClusterLabelName
					}
				}

				Dig.Spec.GpintArray = append(Dig.Spec.GpintArray, &localGpint)
			}
			// Populate the Nwint intents
			SourceNwintMap := digValue.NwintMap
			for _, nwintValue := range SourceNwintMap {
				localNwint := DigsNwint{}
				localNwint.Metadata = nwintValue.Nwint.Metadata
				for _, wrkintValue := range nwintValue.WrkintMap {
					localWrkint := WorkloadIntents{}
					localWrkint.Metadata = wrkintValue.Wrkint.Metadata
					localWrkint.Spec.AppName = wrkintValue.Wrkint.Spec.AppName
					localWrkint.Spec.Interfaces = wrkintValue.Interfaces
					localNwint.Spec.WorkloadIntentsArray = append(localNwint.Spec.WorkloadIntentsArray,
						&localWrkint)
				}
				Dig.Spec.NwintArray = append(Dig.Spec.NwintArray, &localNwint)
			}
			h.DigpReturnJSON = append(h.DigpReturnJSON, Dig)
		}
	}
}


// Fetch latest version of composite app
func(h *OrchestrationHandler) FetchLatestVersion() (int, string) {
	var verList []int
	// Fetch all versions for a given composite application
	retCode, versionList := h.GetCompAppVersions("")
	if retCode != http.StatusOK {
		return retCode, ""
	}

	for _, version := range versionList {
		ver, _ := strconv.Atoi(version[1:])
		verList = append(verList, ver)
	}

	sort.Ints(verList[:])

	log.Infof("version list: %d", verList)

	latestVersion := strconv.Itoa(verList[len(verList)-1])

	return http.StatusOK, "v" + latestVersion
}
