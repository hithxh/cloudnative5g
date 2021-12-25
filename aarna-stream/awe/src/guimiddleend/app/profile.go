package app

import (
	"encoding/base64"
	"encoding/json"

	log "github.com/sirupsen/logrus"
)

// ProfileData captures per app profile
type ProfileData struct {
	Name        string            `json:"profileName"`
	AppProfiles map[string]string `json:"appProfile"`
}

// ProfileMeta is metadata for the profile APIs
type ProfileMeta struct {
	Metadata appMetaData `json:"metadata" bson:"metadata"`
	Spec     ProfileSpec `json:"spec" bson:"spec"`
}

// ProfileMeta is metadata for the profile APIs
type ProfileMetaEMCO struct {
	Metadata apiMetaData `json:"metadata" bson:"metadata"`
	Spec     ProfileSpec `json:"spec" bson:"spec"`
}

// ProfileSpec is the spec for the profile APIs
type ProfileSpec struct {
	AppName string `json:"app-name"`
}

// ProfileHandler This implements the orchworkflow interface
type ProfileHandler struct {
	orchURL      string
	orchInstance *OrchestrationHandler
	response     struct {
		payload map[string][]byte
		status  map[string]string
	}
}

func (h *ProfileHandler) getObject() (interface{}, interface{}) {
	_, respcode := h.getEMCOObject()
	_, respcode = h.getMiddleEndObject()
	return nil, respcode
}

func (h *ProfileHandler) getMiddleEndObject() (interface{}, interface{}) {
	respcode := 200
	orch := h.orchInstance
	dataRead := h.orchInstance.dataRead

	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			for _, ca := range orch.CompositeAppReturnJSON {
				if ca.Metadata.Name == compositeAppValue.Metadata.Metadata.Name {
					compositeAppValue.ProfileDataArray = make(map[string]*ProfilesData)
					for _, appProfile := range ca.Spec.ProfileArray {
						ProfilesDataInstance := ProfilesData{}
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name] = &ProfilesDataInstance
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].Profile.Metadata.Name = appProfile.Metadata.Name
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].Profile.Metadata.Description = appProfile.Metadata.Description
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].Profile.Metadata.Status = appProfile.Metadata.Status
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].Profile.Metadata.UserData1 = appProfile.Metadata.UserData1
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].Profile.Metadata.UserData2 = appProfile.Metadata.UserData2
						compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles = make([]ProfileMeta, len(appProfile.Spec.ProfilesArray))
						for appProfileIndex, profile := range appProfile.Spec.ProfilesArray {
							compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Metadata.Name = profile.Metadata.Name
							compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Metadata.Description = profile.Metadata.Description
							compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Metadata.UserData1 = profile.Metadata.UserData1
							compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Metadata.UserData2 = profile.Metadata.UserData2
							compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Metadata.Status = profile.Metadata.Status
							if h.orchInstance.treeFilter.compositeAppMultiPart {
								compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Metadata.ChartContent = profile.Metadata.ChartContent
							}
							appName := profile.Spec.AppName
							compositeAppValue.ProfileDataArray[appProfile.Metadata.Name].AppProfiles[appProfileIndex].Spec.AppName = compositeAppValue.AppsDataArray[appName].App.Metadata.Name
						}
					}
				}
			}
		}
	}
	return nil, respcode
}

func (h *ProfileHandler) getEMCOObject() (interface{}, interface{}) {
	orch := h.orchInstance
	vars := orch.Vars
	dataRead := h.orchInstance.dataRead
	retcode := 200
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		var profileList []ProfileMeta
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version + "/composite-profiles"
		for profileName, profileValue := range compositeAppValue.ProfileDataArray {
			url := h.orchURL + "/" + profileName + "/profiles"
			retcode, respval, err := orch.apiGet(url, compositeAppMetadata.Name+"_getprofiles")
			log.Infof("Get app profiles status: %d", retcode)
			if err != nil {
				log.Errorf("Failed to read profile %s", profileName)
				return nil, 500
			}
			if retcode != 200 {
				log.Errorf("Failed to read profile %s", profileName)
				return nil, retcode
			}
			json.Unmarshal(respval, &profileList)
			profileValue.AppProfiles = make([]ProfileMeta, len(profileList))
			for appProfileIndex, appProfile := range profileList {
				profileValue.AppProfiles[appProfileIndex] = appProfile
				if h.orchInstance.treeFilter.compositeAppMultiPart {
					URL := h.orchURL + "/" + profileName + "/profiles/" + appProfile.Metadata.Name
					log.Debugf("composite profile object URL multipart: %s", URL)
					_, data, _ := h.orchInstance.apiGetMultiPart(URL, "_getAppProfileMultiPart")
					profileValue.AppProfiles[appProfileIndex].Metadata.ChartContent = base64.StdEncoding.EncodeToString(data)
				}
			}
		}
	}
	return nil, retcode
}

func (h *ProfileHandler) getAnchor() (interface{}, interface{}) {
	orch := h.orchInstance
	vars := orch.Vars
	respcode := 200
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		var profilemetaList []ProfileMeta
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version + "/composite-profiles"

		respcode, respdata, err := orch.apiGet(h.orchURL, compositeAppMetadata.Name+"_getcprofile")
		if err != nil {
			log.Errorf("Failed to get composite profiles\n")
			return nil, 500
		}
		if respcode != 200 {
			log.Errorf("composite profile GET status %d\n", respcode)
			return nil, respcode
		}
		json.Unmarshal(respdata, &profilemetaList)
		compositeAppValue.ProfileDataArray = make(map[string]*ProfilesData, len(profilemetaList))
		for _, value := range profilemetaList {
			ProfilesDataInstance := ProfilesData{}
			ProfilesDataInstance.Profile = value
			compositeAppValue.ProfileDataArray[value.Metadata.Name] = &ProfilesDataInstance
		}
	}
	return nil, respcode
}

func (h *ProfileHandler) deleteObject() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version + "/composite-profiles/"
		for profileName, profileValue := range compositeAppValue.ProfileDataArray {
			for _, appProfileValue := range profileValue.AppProfiles {
				url := h.orchURL + profileName + "/profiles/" + appProfileValue.Metadata.Name

				log.Infof("Delete app profiles %s", url)
				resp, err := orch.apiDel(url, compositeAppMetadata.Name+"_delappProfiles")
				if err != nil {
					return err
				}
				if resp != 204 {
					return resp
				}
				log.Infof("Delete profiles status: %d", resp)
			}
		}
	}
	return nil
}

func (h *ProfileHandler) deleteAnchor() interface{} {
	orch := h.orchInstance
	vars := orch.Vars
	dataRead := h.orchInstance.dataRead
	for _, compositeAppValue := range dataRead.compositeAppMap {
		if compositeAppValue.Status == "checkout" {
			continue
		}
		compositeAppMetadata := compositeAppValue.Metadata.Metadata
		compositeAppSpec := compositeAppValue.Metadata.Spec
		h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
			vars["project-name"] + "/composite-apps/" + compositeAppMetadata.Name +
			"/" + compositeAppSpec.Version + "/composite-profiles/"

		for profileName, _ := range compositeAppValue.ProfileDataArray {
			url := h.orchURL + profileName
			log.Infof("Delete profile %s", url)
			resp, err := orch.apiDel(url, compositeAppMetadata.Name+"_delProfile")
			if err != nil {
				return err
			}
			if resp != 204 {
				return resp
			}
			log.Infof("Delete profile status: %d", resp)
		}
	}
	return nil
}

func (h *ProfileHandler) createAnchor() interface{} {
	orch := h.orchInstance
	vars := orch.Vars

	profileCreate := ProfileMetaEMCO{
		Metadata: apiMetaData{
			Name:        vars["composite-app-name"] + "_profile",
			Description: "Profile created from middleend",
			UserData1:   "data 1",
			UserData2:   "data2"},
	}
	jsonLoad, _ := json.Marshal(profileCreate)
	h.orchURL = "http://" + orch.MiddleendConf.OrchService + "/v2/projects/" +
		vars["project-name"] + "/composite-apps"
	url := h.orchURL + "/" + vars["composite-app-name"] + "/" + vars["version"] + "/composite-profiles"
	resp, err := orch.apiPost(jsonLoad, url, vars["compostie-app-name"]+"_profile")
	if err != nil {
		return err
	}
	if resp != 201 {
		return resp
	}
	log.Infof("ProfileHandler response: %d", resp)

	return nil
}

func (h *ProfileHandler) createObject() interface{} {
	orch := h.orchInstance
	vars := orch.Vars

	for i := range orch.meta {
		fileName := orch.meta[i].ProfileMetadata.FileName
		appName := orch.meta[i].Metadata.Name
		profileName := orch.meta[i].ProfileMetadata.Name
		fileContent := orch.meta[i].ProfileMetadata.FileContent

		// Upload the application helm chart
		fh := orch.file[fileName]
		profileAdd := ProfileMetaEMCO{
			Metadata: apiMetaData{
				Name:        profileName,
				Description: "NA",
				UserData1:   "data 1",
				UserData2:   "data2"},
			Spec: ProfileSpec{
				AppName: appName},
		}
		compositeProfilename := vars["composite-app-name"] + "_profile"

		url := h.orchURL + "/" + vars["composite-app-name"] + "/" + vars["version"] + "/" +
			"composite-profiles" + "/" + compositeProfilename + "/profiles"
		log.Debugf("profileAdd is: %s", profileAdd)
		jsonLoad, _ := json.Marshal(profileAdd)
		orch.response.lastKey = profileName
		status, err := orch.apiPostMultipart(jsonLoad, fh, url, profileName, fileName, fileContent)
		if err != nil {
			log.Fatalln(err)
		}
		if status != 201 {
			return status
		}
		log.Infof("CompositeProfile profile %s status: %d url: %s", profileName, status, url)
	}

	return nil
}

func createProfile(I orchWorkflow) interface{} {
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

func delProfileData(I orchWorkflow) interface{} {
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
