package app

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"

	"example.com/configsvc/db"
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

// CdsBlueprint ...
type CdsBlueprint struct {
	BlueprintModel struct {
		ID                  string      `json:"id"`
		ArtifactUUID        interface{} `json:"artifactUUId"`
		ArtifactType        string      `json:"artifactType"`
		ArtifactVersion     string      `json:"artifactVersion"`
		ArtifactDescription string      `json:"artifactDescription"`
		InternalVersion     interface{} `json:"internalVersion"`
		CreatedDate         time.Time   `json:"createdDate"`
		ArtifactName        string      `json:"artifactName"`
		Published           string      `json:"published"`
		UpdatedBy           string      `json:"updatedBy"`
		Tags                string      `json:"tags"`
	} `json:"blueprintModel"`
}

//CBAWorkflows ...
type CBAWorkflows struct {
	BlueprintName string   `json:"blueprintName"`
	Version       string   `json:"version"`
	Workflows     []string `json:"workflows"`
}

type bpSchemaKey struct {
	CompApp   string `json:"compApp,omitempty"`
	CVersion  string `json:"cVersion,omitempty"`
	App       string `json:"appName,omitempty"`
	WfType    string `json:"wfType,omitempty"`
	BpName    string `json:"bpName,omitempty"`
	BpAction  string `json:"bpAction,omitempty"`
	BpVersion string `json:"bpVersion,omitempty"`
}

// NbWorkflowData ...
type NbWorkflowData struct {
	ID                  string            `json:"id"`
	ArtifactVersion     string            `json:"artifactVersion"`
	ArtifactDescription string            `json:"artifactDescription"`
	CreatedDate         time.Time         `json:"createdDate"`
	ArtifactName        string            `json:"artifactName"`
	Published           string            `json:"published"`
	UpdatedBy           string            `json:"updatedBy"`
	Tags                string            `json:"tags"`
	Workflows           []workflowObjects `json:"workflows"`
}

type workflowObjects struct {
	Workflow    string `json:"name"`
	Description string `json:"description"`
}

// CdsInterface ...
type CdsInterface struct {
	CdsEndpoint string
	payload     map[string]interface{}
}

// GetCdsInterface ...
func GetCdsInterface() *CdsInterface {
	return &CdsInterface{}
}

type getSchemaPayload struct {
	ActionIdentifiers aIdentifiers           `json:"actionIdentifiers"`
	Payload           map[string]interface{} `json:"payload"`
	CommonHeader      struct {
		SubRequestID string `json:"subRequestId"`
		RequestID    string `json:"requestId"`
		OriginatorID string `json:"originatorId"`
	} `json:"commonHeader"`
	ActionType string `json:"actionType, omitempty"`
}

type wfPayload struct {
	CommonHeader struct {
		Timestamp    time.Time   `json:"timestamp"`
		OriginatorID string      `json:"originatorId"`
		RequestID    string      `json:"requestId"`
		SubRequestID string      `json:"subRequestId"`
		Flags        interface{} `json:"flags"`
	} `json:"commonHeader"`
	ActionIdentifiers aIdentifiers `json:"actionIdentifiers"`
	Status            struct {
		Code         int         `json:"code"`
		EventType    string      `json:"eventType"`
		Timestamp    time.Time   `json:"timestamp"`
		ErrorMessage interface{} `json:"errorMessage"`
		Message      string      `json:"message"`
	} `json:"status"`
	Payload map[string]interface{} `json:"payload"`
}

type aIdentifiers struct {
	Mode             string `json:"mode"`
	BlueprintName    string `json:"blueprintName"`
	BlueprintVersion string `json:"blueprintVersion"`
	ActionName       string `json:"actionName"`
	ActionType	string `json:"actionType, omitempty"`
}

func (c *CdsInterface) apiPost(jsonLoad []byte, url string) (interface{}, []byte, error) {
	// prepare and POST API
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonLoad))
	if err != nil {
		return nil, nil, err
	}
	// --header 'Content-Type: application/json'
	// --header 'Accept: application/json'
	// --header 'Authorization: Basic Y2NzZGthcHBzOmNjc2RrYXBwcw=='
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("Accept", "application/json")
	request.Header.Add("Authorization", "Basic Y2NzZGthcHBzOmNjc2RrYXBwcw==")
	client := http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()

	// Prepare the response
	data, _ := ioutil.ReadAll(resp.Body)

	return resp.StatusCode, data, nil
}

func (c *CdsInterface) apiGet(url string) (interface{}, []byte, error) {
	// prepare and DEL API
	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, nil, err
	}
	// --header 'Authorization: Basic Y2NzZGthcHBzOmNjc2RrYXBwcw=='
	request.Header.Add("Authorization", "Basic Y2NzZGthcHBzOmNjc2RrYXBwcw==")
	client := http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()

	// Prepare the response
	data, _ := ioutil.ReadAll(resp.Body)
	return resp.StatusCode, data, nil
}

func (c *CdsInterface) mergeValues(dest map[string]interface{}, src map[string]interface{}) map[string]interface{} {
	for k, v := range src {
		// If the key doesn't exist already, then just set the key to that value
		if _, exists := dest[k]; !exists {
			dest[k] = v
			continue
		}
		nextMap, ok := v.(map[string]interface{})
		// If it isn't another map, overwrite the value
		if !ok {
			dest[k] = v
			continue
		}
		// Edge case: If the key exists in the destination, but isn't a map
		destMap, isMap := dest[k].(map[string]interface{})
		// If the source map has a map for this key, prefer it
		if !isMap {
			dest[k] = v
			continue
		}
		// If we got to this point, it is a map in both, so merge them
		dest[k] = c.mergeValues(destMap, nextMap)
	}
	return dest
}

func (c *CdsInterface) parsePayload(src map[string]interface{}, pkey string) error {
	for k := range src {
		if k == pkey {
			srcMap, isMap := src[k].(map[string]interface{})
			if !isMap {
				fmt.Printf(" value is not a map %s\n", src[k])
				return errors.New("vlaue is not a map ")
			}
			c.payload = c.mergeValues(c.payload, srcMap)
			return nil
		}
		// recursive if map again
		newMap, isMap := src[k].(map[string]interface{})
		if !isMap {
			continue
		}
		c.parsePayload(newMap, pkey)
	}
	return nil
}

func (c *CdsInterface) storePayload(wfType string, cName string, cVersion string, App string, src map[string]interface{}, bp string, a string, v string) {
	err := c.parsePayload(src, "httpResponse")
	if err != nil {
		fmt.Printf("Failed to find %s in payload\n", "httpResponse")
		return
	}

	key := bpSchemaKey{
		CompApp:   cName,
		CVersion:  cVersion,
		App:       App,
		WfType:    wfType,
		BpName:    bp,
		BpAction:  a,
		BpVersion: v,
	}
	c.payload["actionType"] = wfType
	err = db.DBconn.Insert("configTable", key, nil, "wfPayload", c.payload)
	if err != nil {
		fmt.Printf("failed to insert data to the db")
	}
}

func (c *CdsInterface) getWfSchema(nbWfData NbWorkflowData, wfs []string) ([]workflowObjects, error) {
	s := []workflowObjects{}
	// See if the blueprint has *schema worklows
	for _, str := range wfs {
		localWfObject := workflowObjects{}
		fmt.Printf("str %s\n", str)
		if strings.Contains(str, "-schema") {
			//fmt.Printf("process str %s\n", str)
			for _, wf := range wfs {
				//fmt.Printf("%s %s\n", wf, strings.TrimRight(str, "-schema"))
				if wf == strings.TrimRight(str, "-schema") {
					localWfObject.Workflow = wf
					localWfObject.Description = "some wf"
					s = append(s, localWfObject)
				}
			}
		}
	}

	return s, nil
}

// StoreAppBps ...
func (c *CdsInterface) StoreAppBps(w http.ResponseWriter, r *http.Request) {
	var jsonData AppconfigData

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&jsonData)
	if err != nil {
		fmt.Printf("Failed to parse json")
		w.WriteHeader(500)
		return
	}

	// Get Payload Schema for all the worflows which have Schema wf
	for _, bp := range jsonData.BpArray {
		for _, wf := range bp.Workflows {
			// Get the list of blueptints from CDS
			url := "http://" + c.CdsEndpoint + "/api/v1/execution-service/process"
			pl := getSchemaPayload{}
			pl.ActionIdentifiers.Mode = "sync"
			pl.ActionIdentifiers.BlueprintName = bp.ArtifactName
			pl.ActionIdentifiers.BlueprintVersion = bp.ArtifactVersion

			// Prepare the payload
			pl.Payload = make(map[string]interface{})
			reqString := wf.Name + "-schema-request"
			propString := wf.Name + "-schema-properties"
			pl.Payload[reqString] = map[string]string{propString: ""}

			pl.ActionIdentifiers.ActionName = wf.Name + "-schema"
			pl.CommonHeader.SubRequestID = "SUB_REQUEST_UUID"
			pl.CommonHeader.RequestID = "RESQUEST_UUID"
			pl.CommonHeader.OriginatorID = "SDNC_DG"

			//fmt.Printf("json load %s\n", pl)
			jsonLoad, _ := json.Marshal(pl)
			_, data, err := c.apiPost(jsonLoad, url)
			if err != nil {
				return
			}
			// Unmarshal data into the workflow payload
			//fmt.Printf("compAppHandler resp %s\n", data)
			p := wfPayload{}
			json.Unmarshal(data, &p)
			c.payload = nil //FIXME: creat a local variable for payload
			c.payload = make(map[string]interface{})
			c.storePayload(wf.Type, jsonData.CompApp, jsonData.CompVersion, jsonData.AppName,
				p.Payload, pl.ActionIdentifiers.BlueprintName,
				pl.ActionIdentifiers.ActionName,
				pl.ActionIdentifiers.BlueprintVersion)
		}
	}
}

// GetAppWorkflows ...
func (c *CdsInterface) GetAppWorkflows(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	wfType := r.URL.Query().Get("type")

	key := bpSchemaKey{
		CompApp:  vars["compApp"],
		CVersion: vars["compVersion"],
		App:      vars["appName"],
	}

	if len(wfType) != 0 {
		key.WfType = wfType
	}

	jsonLoad, err := json.Marshal(key)
	values, err := db.DBconn.Find("configTable", jsonLoad, "wfPayload")
	if err != nil {
		msg:=fmt.Sprintf("Failed to get WF for App: %s\n", vars["appName"])
		fmt.Println(msg)
		w.Write([]byte(msg))
		w.WriteHeader(500)
		return
	}
	if len(values) == 0 {
		msg:=fmt.Sprintf("No WFs found for App: %s\n", vars["appName"])
		fmt.Println(msg)
		w.Write([]byte(msg))
		w.WriteHeader(200)
		return
	}

	actionIdentifiers := []aIdentifiers{}
	for _, val := range values {
		localSchemaPayload := getSchemaPayload{}
		err = db.DBconn.Unmarshal(val, &localSchemaPayload)
		if err != nil {
			fmt.Printf("faile to marshal json %s\n", err)
			w.WriteHeader(500)
			return
		}
		fmt.Printf("data read %s\n", localSchemaPayload)
		localSchemaPayload.ActionIdentifiers.ActionType = localSchemaPayload.ActionType
		actionIdentifiers = append(actionIdentifiers, localSchemaPayload.ActionIdentifiers)
	}

	retJSON, _ := json.Marshal(actionIdentifiers)
	w.WriteHeader(200)
	w.Write(retJSON)
	return
}

// GetConfig ...
// This API fetches the payload for the give BP and WF from the DB
// and executes the WF
func (c *CdsInterface) GetConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	url := "http://" + c.CdsEndpoint + "/api/v1/execution-service/process"

	key := bpSchemaKey{
		BpName:    vars["bpName"],
		BpAction:  vars["wfName"] + "-schema",
		BpVersion: vars["bpVersion"],
	}
	nfURL := r.URL.Query().Get("nf-url")
	fmt.Printf("URL %s\n", nfURL)

	jsonLoad, err := json.Marshal(key)
	values, err := db.DBconn.Find("configTable", jsonLoad, "wfPayload")
	if err != nil {
		fmt.Printf("failed to fetech data")
		w.WriteHeader(500)
		return
	}
	if len(values) == 0 {
		fmt.Printf("Read 0 data from DB")
		w.WriteHeader(500)
		return
	}
	schemaPayload := getSchemaPayload{}
	err = db.DBconn.Unmarshal(values[0], &schemaPayload)
	if err != nil {
		fmt.Printf("faile to marshal json %s\n", err)
		w.WriteHeader(500)
		return
	}
	// Set nil value for actionType
	schemaPayload.ActionType = "" 

	jsonLoad, err = json.Marshal(schemaPayload)
	retCode, data, err := c.apiPost(jsonLoad, url)
	if err != nil {
		w.Write(data)
		w.WriteHeader(retCode.(int))
		return
	}
	wfResp := wfPayload{}
	json.Unmarshal(data, &wfResp)
	c.payload = nil //FIXME: creat a local variable for payload
	c.payload = make(map[string]interface{})
	err = c.parsePayload(wfResp.Payload, "httpResponse")
	if err != nil {
		fmt.Printf("Failed to find %s in payload\n", "httpResponse")
		w.WriteHeader(500)
		return
	}

	// FIXME hardcode the value for now
	// FIXME_json := `{
	//	"pccRules": [
	//		"Pccrule1"
	//	],
	//	"sessRules": [
	//		"sessrule1"
	//	],
	//	"policyCtrlReqTriggers": [
	//		"QOS_NOTIF",
	//		"RES_MO_RE",
	//		"DEF_QOS_CH",
	//		"UE_IP_CH",
	//		"US_RE"
	//	]
	//}`
	//raw := json.RawMessage(FIXME_json)
	//retJSON, _ = json.Marshal(raw)

	retJSON, _ := json.Marshal(c.payload)
	w.Write(retJSON)
	w.WriteHeader(200)
	return
}

func (c *CdsInterface) replacePayload(src map[string]interface{}, dest map[string]interface{}, pkey string) error {
	for k := range src {
		if strings.Contains(k, pkey) {
			_, isMap := src[k].(map[string]interface{})
			if !isMap {
				fmt.Printf(" value is not a map %s\n", src[k])
				return errors.New("vlaue is not a map ")
			}
			src[k] = dest
			return nil
		}
		// recursive if map again
		newMap, isMap := src[k].(map[string]interface{})
		if !isMap {
			continue
		}
		c.replacePayload(newMap, dest, pkey)
	}
	return nil
}
// DeleteConfig ...
// This API fetches the payload for the give BP and WF from the DB
// and executes the WF
func (c *CdsInterface) DeleteConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	url := "http://" + c.CdsEndpoint + "/api/v1/execution-service/process"

	key := bpSchemaKey{
		BpName:    vars["bpName"],
		BpAction:  vars["wfName"] + "-schema",
		BpVersion: vars["bpVersion"],
	}
	nfURL := r.URL.Query().Get("nf-url")
	fmt.Printf("URL %s\n", nfURL)


	jsonLoad, err := json.Marshal(key)
	values, err := db.DBconn.Find("configTable", jsonLoad, "wfPayload")
	if err != nil {
		fmt.Printf("failed to fetech data")
		w.WriteHeader(500)
		return
	}
	if len(values) == 0 {
		fmt.Printf("Read 0 data from DB")
		w.WriteHeader(500)
		return
	}
	schemaPayload := getSchemaPayload{}
	err = db.DBconn.Unmarshal(values[0], &schemaPayload)
	if err != nil {
		fmt.Printf("faile to marshal json %s\n", err)
		w.WriteHeader(500)
		return
	}

	// Set nil value for actionType
	schemaPayload.ActionType = ""

	jsonLoad, err = json.Marshal(schemaPayload)
	retCode, data, err := c.apiPost(jsonLoad, url)
	if err != nil {
		w.Write(data)
		w.WriteHeader(retCode.(int))
		return
	}

	w.Write(data)
	w.WriteHeader(204)
	return
}

// PostConfig ...
// This API fetches the payload for the give BP and WF from the DB
// and executes the WF
func (c *CdsInterface) PostConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	url := "http://" + c.CdsEndpoint + "/api/v1/execution-service/process"

	key := bpSchemaKey{
		BpName:    vars["bpName"],
		BpAction:  vars["wfName"] + "-schema",
		BpVersion: vars["bpVersion"],
	}
	nfURL := r.URL.Query().Get("nf-url")
	fmt.Printf("URL %s\n", nfURL)

	jsonData := map[string]interface{}{}
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&jsonData)
	if err != nil {
		fmt.Printf("Failed to parse json")
		w.WriteHeader(500)
		return
	}

	jsonLoad, err := json.Marshal(key)
	values, err := db.DBconn.Find("configTable", jsonLoad, "wfPayload")
	if err != nil {
		fmt.Printf("failed to fetech data")
		w.WriteHeader(500)
		return
	}
	if len(values) == 0 {
		fmt.Printf("Read 0 data from DB")
		w.WriteHeader(500)
		return
	}
	schemaPayload := getSchemaPayload{}
	err = db.DBconn.Unmarshal(values[0], &schemaPayload)
	if err != nil {
		fmt.Printf("faile to marshal json %s\n", err)
		w.WriteHeader(500)
		return
	}

	// Replace the payload with the one recieved in the POST
	// call
	c.replacePayload(schemaPayload.Payload, jsonData, "EditPayload")
	fmt.Printf("Final payload %s\n", schemaPayload)

	// Set nil value for actionType
	schemaPayload.ActionType = "" 
	jsonLoad, err = json.Marshal(schemaPayload)
	retCode, data, err := c.apiPost(jsonLoad, url)
	if err != nil {
		w.Write(data)
		w.WriteHeader(retCode.(int))
		return
	}

	w.Write(data)
	w.WriteHeader(retCode.(int))
	return
}

// GetAllWorkflow ...
// This API returns an array of NbWorkflowDat
func (c *CdsInterface) GetAllWorkflow(w http.ResponseWriter, r *http.Request) {
	var b []CdsBlueprint

	// Get the list of blueptints from CDS
	url := "http://" + c.CdsEndpoint + "/api/v1/blueprint-model"
	retCode, data, err := c.apiGet(url)
	if err != nil {
		fmt.Printf("Request to get Blueprints failed %s", err)
		w.Write(data)
		if retCode != nil {
			w.WriteHeader(retCode.(int))
		}
		return
	}

	json.Unmarshal(data, &b)

	nbMap := []NbWorkflowData{}
	for _, i := range b {
		// Call get workflows for each blueprint
		// api/v1/blueprint-model/workflows/blueprint-name/{bpName}/version/{version}
		wf := CBAWorkflows{}

		v := i.BlueprintModel
		bpName := v.ArtifactName
		version := v.ArtifactVersion

		wfURL := "http://" + c.CdsEndpoint + "/api/v1/blueprint-model/workflows/blueprint-name/" +
			bpName + "/version/" + version

		retCode, data, err := c.apiGet(wfURL)
		if err != nil {
			fmt.Printf("Request to get Blueprints workflows failed %s", err)
			w.Write(data)
			w.WriteHeader(retCode.(int))
		}

		json.Unmarshal(data, &wf)

		localNbData := NbWorkflowData{}
		localNbData.ID = v.ID
		localNbData.ArtifactVersion = v.ArtifactVersion
		localNbData.CreatedDate = v.CreatedDate
		localNbData.ArtifactName = v.ArtifactName
		localNbData.Published = v.Published
		localNbData.Tags = v.Tags
		localNbData.UpdatedBy = v.UpdatedBy

		// Parse each workflow. Get the sschema payload schema if the BP has supporting WF.
		// Store the the BP, WF, Payload in DB.
		finalWfs, err := c.getWfSchema(localNbData, wf.Workflows)
		if err != nil {
			w.Write([]byte("Failed to sort and store wf Schemas"))
			w.WriteHeader(500)
			return
		}

		localNbData.Workflows = finalWfs
		nbMap = append(nbMap, localNbData)
	}

	// Construct response payload
	retval, _ := json.Marshal(nbMap)
	w.Header().Set("Content-type", "application/json")
	w.WriteHeader(200)
	w.Write(retval)
}
