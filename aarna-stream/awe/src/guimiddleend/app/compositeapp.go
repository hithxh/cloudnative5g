package app

import (
	"encoding/base64"
	"encoding/json"

	"example.com/middleend/db"

	log "github.com/sirupsen/logrus"
)

type AppconfigData struct {
	CompApp     string `json:"compositeApp"`
	CompVersion string `json:"compVersion"`
	AppName     string `json:"appName"`
	BpArray     []struct {
		ArtifactName    string `json:"artifactName"`
		ArtifactVersion string `json:"artifactVersion"`
		Workflows       []struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Type        string `json:"type"`
		} `json:"workflows"`
	} `json:"blueprintModels"`
}

// CompositeApp application structure
type CompositeApp struct {
	Metadata apiMetaData      `json:"metadata"`
	Spec     compositeAppSpec `json:"spec"`
}

type compositeAppSpec struct {
	Version string `json:"version" bson:"version"`
}

// Application structure
type Application struct {
	Metadata appMetaData `json:"metadata" bson:"metadata"`
}

// compAppHandler , This implements the orchworkflow interface
type compAppHandler struct {
	orchURL      string
	orchInstance *OrchestrationHandler
}

// CompositeAppKey is the mongo key to fetch apps in a composite app
type CompositeAppKey struct {
	Cname    string      `json:"compositeapp"`
	Project  string      `json:"project"`
	Cversion string      `json:"compositeappversion"`
	App      interface{} `json:"app"`
}

type DraftCompositeAppKey struct {
	Cname    string `json:"compositeapp"`
	Project  string `json:"project"`
	Cversion string `json:"compositeappversion"`
}


func (h *compAppHandler) getObject() (interface{}, interface{}) {
	_, respcode := h.getEMCOObject()
	_, respcode = h.getMiddleEndObject()
	return nil, respcode
}

func (h *compAppHandler) getMiddleEndObject() (interface{}, interface{}) {
	respcode := 200
	orch := h.orchInstance
	dataRead := h.orchInstance.dataRead

	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			compositeAppValue.AppsDataArray = make(map[string]*AppsData)
			for index, ca := range orch.CompositeAppReturnJSON {
				if ca.Metadata.Name == compositeAppValue.Metadata.Metadata.Name {
					for _, value := range ca.Spec.AppsArray {
						var appsDataInstance AppsData
						appName := value.Metadata.Name
						appsDataInstance.App.Metadata.Name = (*value).Metadata.Name
						appsDataInstance.App.Metadata.Description = (*value).Metadata.Description
						appsDataInstance.App.Metadata.Status = (*value).Metadata.Status
						appsDataInstance.App.Metadata.UserData1 = (*value).Metadata.UserData1
						appsDataInstance.App.Metadata.UserData2 = (*value).Metadata.UserData2
						if h.orchInstance.treeFilter.compositeAppMultiPart {
							appsDataInstance.App.Metadata.ChartContent = ca.Spec.AppsArray[index].Metadata.ChartContent
						}
						compositeAppValue.AppsDataArray[appName] = &appsDataInstance
					}
				}
			}
		}
	}
	return nil, respcode
}

func (h *compAppHandler) getEMCOObject() (interface{}, interface{}) {
	orch := h.orchInstance
	respcode := 200
	dataRead := h.orchInstance.dataRead
	vars := orch.Vars

	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}

		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version + "/apps"
		log.Infof("composite app object URL: %s", h.orchURL)
		respcode, respdata, err := orch.apiGet(h.orchURL, vars["composite-app-name"]+"_getapps")

		if err != nil {
			return nil, 500
		}
		if respcode != 200 {
			return nil, respcode
		}
		log.Infof("Get app status: %d", respcode)

		compositeAppValue.AppsDataArray = make(map[string]*AppsData, len(respdata))
		var appList []Application
		json.Unmarshal(respdata, &appList)
		for _, value := range appList {
			var appsDataInstance AppsData
			appName := value.Metadata.Name
			appsDataInstance.App = value
			if h.orchInstance.treeFilter.compositeAppMultiPart {
				URL := h.orchURL + "/" + appName
				_, data, _ := h.orchInstance.apiGetMultiPart(URL, "_getAppMultiPart")
				appsDataInstance.App.Metadata.ChartContent = base64.StdEncoding.EncodeToString(data)
			}
			compositeAppValue.AppsDataArray[appName] = &appsDataInstance
		}
	}
	return nil, respcode
}

func (h *compAppHandler) getAnchor() (interface{}, interface{}) {
	orch := h.orchInstance
	dataRead := h.orchInstance.dataRead
	vars := orch.Vars
	respcode := 200
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version
		log.Debugf("composite app anchor URL: %s", h.orchURL)
		respcode, _, err := orch.apiGet(h.orchURL, vars["composie-app-name"]+"_getcompositeapp")
		if err != nil {
			return nil, 500
		}
		if respcode != 200 {
			return nil, respcode
		}
		log.Infof("Get composite App status: %d", respcode)
		//json.Unmarshal(respdata, &dataRead.CompositeApp)
	}
	return nil, respcode
}

func (h *compAppHandler) deleteObject() interface{} {
	orch := h.orchInstance
	dataRead := h.orchInstance.dataRead
	vars := orch.Vars
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version
		appList := compositeAppValue.AppsDataArray
		for _, value := range appList {
			url := h.orchURL + "/apps/" + value.App.Metadata.Name
			log.Infof("Delete app %s\n", url)
			resp, err := orch.apiDel(url, compositeAppMetadata.Name+"_delapp")
			if err != nil {
				return err
			}
			if resp != 204 {
				return resp
			}
			log.Infof("Delete app status %s\n", resp)
		}
	}
	return nil
}

func (h *compAppHandler) deleteAnchor() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec

		//if status is checkout, delete the object from db
		if compositeAppValue.Status == "checkout" {
			err := db.DBconn.Delete(orch.MiddleendConf.StoreName, vars)
			if err != nil {
				log.Infof("Unable to delete compapp from middleend", err)
			} else {
				log.Infof("Composite app %s : %s deleted from middleend", compositeAppMetadata.Name, compositeAppSpec.Version)
			}
		} else {
			h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
				vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
				"/" + compositeAppSpec.Version
			log.Infof("Delete composite app %s\n", h.orchURL)
			resp, err := orch.apiDel(h.orchURL, compositeAppMetadata.Name+"_delcompapp")
			if err != nil {
				return err
			}
			if resp != 204 {
				return resp
			}
			log.Infof("Delete compapp status %s\n", resp)
		}
	}
	return nil
}

// CreateAnchor creates the anchor point for composite applications,
// profiles, intents etc. For example Anchor for the composite application
// will create the composite application resource in the the DB, and all apps
// will get created and uploaded under this anchor point.
func (h *compAppHandler) createAnchor() interface{} {
	orch := h.orchInstance
	vars := orch.Vars

	compAppCreate := CompositeApp{
		Metadata: apiMetaData{
			Name:        vars["composite-app-name"],
			Description: vars["description"],
			UserData1:   "data 1",
			UserData2:   "data 2"},
		Spec: compositeAppSpec{
			Version: vars["version"]},
	}

	jsonLoad, _ := json.Marshal(compAppCreate)
	log.Debugf("create anchor composite app: %s", jsonLoad)
	tem := CompositeApp{}
	json.Unmarshal(jsonLoad, &tem)
	h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
		vars["project-name"] + "/composite-apps"
	orch.response.lastKey = vars["composite-app-name"]
	resp, err := orch.apiPost(jsonLoad, h.orchURL,  vars["composite-app-name"] + "_compapp")

	if err != nil {
		return err
	}
	if resp != 201 {
		return resp
	}
	//orch.version = "v1"
	log.Infof("compAppHandler response: %d", resp)

	return nil
}

func (h *compAppHandler) createObject() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	for i := range orch.meta {
		fileName := orch.meta[i].Metadata.FileName
		appName := orch.meta[i].Metadata.Name
		appDesc := orch.meta[i].Metadata.Description
		fileContent := orch.meta[i].Metadata.FileContent

		// Upload the application helm chart
		fh := orch.file[fileName]
		compAppAdd := CompositeApp{
			Metadata: apiMetaData{
				Name:        appName,
				Description: appDesc,
				UserData1:   "data 1",
				UserData2:   "data2"},
		}
		url := h.orchURL + "/" + vars["composite-app-name"] + "/" + vars["version"] + "/apps"

		jsonLoad, _ := json.Marshal(compAppAdd)

		status, err := orch.apiPostMultipart(jsonLoad, fh, url, appName, fileName, fileContent)
		orch.response.lastKey = appName
		if err != nil {
			return err
		}
		if status != 201 {
			return status
		}
		log.Infof("Composite app %s createObject status: %d", appName, status)

		// Upload the confiuration BPs to the config svc
		if len(orch.meta[i].BlueprintModels) != 0 {
			// Upload the application helm chart
			c := AppconfigData{}
			c.CompApp = vars["composite-app-name"]
			c.CompVersion = vars["version"]
			c.AppName = appName
			c.BpArray = orch.meta[i].BlueprintModels
			url := "http://" + orch.MiddleendConf.CfgService + "/configsvc/appBps"
			jsonLoad, _ := json.Marshal(c)
			log.Infof("app bp %s\n", c)
			status, err := orch.apiPost(jsonLoad, url, appName+"configwf")
			if err != nil {
				log.Errorf("Failed to store BP %s\n", err.Error())
				return status
			}
		}

	}
	return nil
}

func (h *compAppHandler) getDBObject() (interface{}, interface{}) {
	respcode := 200
	orch := h.orchInstance
	vars := orch.Vars
	key := DraftCompositeAppKey{}
	if orch.treeFilter != nil && orch.treeFilter.compositeAppName != "" {
		key.Cname = orch.treeFilter.compositeAppName
		key.Project = vars["project-name"]
		key.Cversion = orch.treeFilter.compositeAppVersion
	}
	caList, err := orch.GetDraftCompositeApplication(key, "depthAll")
	if err != nil {
		log.Errorf("Encountered error while fetching composite app from middleend collection: %s", err)
		return nil, 500
	}
	for _, ca := range caList {
		orch.CompositeAppReturnJSON = append(orch.CompositeAppReturnJSON, ca)
	}
	return nil, respcode
}

func createCompositeapp(I orchWorkflow) interface{} {
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

func delCompositeapp(I orchWorkflow) interface{} {
	// 1. Delete the object
	err := I.deleteObject()
	if err != nil {
		return err
	}
	// 2. Delete the Anchor
	err = I.deleteAnchor()
	if err != nil {
		return err
	}
	return nil
}
