package app

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// CdsMockClient ...
type CdsMockClient struct {
}

// GetCBAMockClient ...
func GetCBAMockClient() *CdsMockClient {
	return &CdsMockClient{}
}

// GetAllCBA ...
func (c *CdsMockClient) GetAllCBA(w http.ResponseWriter, r *http.Request) {
	bpArray := `[
		{
			 "blueprintModel": {
				 "id": "33fff9d7-5b83-4236-9b5c-549309bf94bc",
				 "artifactUUId": null,
				 "artifactType": "SDNC_MODEL",
				 "artifactVersion": "1.0.0",
				 "artifactDescription": "",
				 "internalVersion": null,
				 "createdDate": "2020-12-23T09:37:42.000Z",
				 "artifactName": "pcf-sm-rest-config",
				 "published": "N",
				 "updatedBy": "Aarna Services",
				 "tags": "pcf-sm-rest-config"
			 }
		 },
	 {
			 "blueprintModel": {
				 "id": "845254fa-8241-49b4-9b1e-858e3ee316af",
				 "artifactUUId": null,
				 "artifactType": "SDNC_MODEL",
				 "artifactVersion": "0.0.1",
				 "artifactDescription": "",
				 "internalVersion": null,
				 "createdDate": "2020-12-07T18:11:31.000Z",
				 "artifactName": "udr-rest-config",
				 "published": "N",
				 "updatedBy": "Aarna Services",
				 "tags": "udr-rest-config"
			 }
		 }
	 ]`

	raw := json.RawMessage(bpArray)
	retJSON, _ := raw.MarshalJSON()
	w.Header().Set("content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(retJSON)
}

// GetCBAWorkflow ...
func (c *CdsMockClient) GetCBAWorkflow(w http.ResponseWriter, r *http.Request) {
	cbaWorkflow := `{
		"blueprintName": "pcf-sm-rest-config",
		"version": "1.0.0",
		"workflows": [
			"pcf-sm-config-get",
			"pcf-sm-config-edit"
		]
	}`
	raw := json.RawMessage(cbaWorkflow)
	retJSON, _ := raw.MarshalJSON()
	w.Header().Set("content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(retJSON)
}

type workflowSpec struct {
	BlueprintName string `json:"blueprintName"`
	WorkflowName  string `json:"workflowName"`
	Version       string `json:"Version"`
}

type schemaGet struct {
	ActionIdentifiers struct {
		Mode             string `json:"mode"`
		BlueprintName    string `json:"blueprintName"`
		BlueprintVersion string `json:"blueprintVersion"`
		ActionName       string `json:"actionName"`
	} `json:"actionIdentifiers"`
	Payload struct {
		PcfSmConfigGetSchemaRequest struct {
			PcfSmConfigGetSchemaProperties struct {
			} `json:"pcf-sm-config-get-schema-properties"`
		} `json:"pcf-sm-config-get-schema-request"`
	} `json:"payload"`
	CommonHeader struct {
		SubRequestID string `json:"subRequestId"`
		RequestID    string `json:"requestId"`
		OriginatorID string `json:"originatorId"`
	} `json:"commonHeader"`
}

// GetWfSchema ...
func (c *CdsMockClient) GetWfSchema(w http.ResponseWriter, r *http.Request) {
	var jsonData schemaGet
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&jsonData)
	if err != nil {
		log.Printf("Failed to parse json")
		log.Fatalln(err)
	}
	// Do nothng, print the json data
	fmt.Printf("json data %s", jsonData)
	wfSchema := `{
		"commonHeader": {
			"timestamp": "2020-12-29T10:15:39.581Z",
			"originatorId": "SDNC_DG",
			"requestId": "RESQUEST_UUID",
			"subRequestId": "SUB_REQUEST_UUID",
			"flags": null
		},
		"actionIdentifiers": {
			"blueprintName": "pcf-sm-rest-config",
			"blueprintVersion": "1.0.0",
			"actionName": "pcf-sm-config-get-schema",
			"mode": "sync"
		},
		"status": {
			"code": 200,
			"eventType": "EVENT_COMPONENT_EXECUTED",
			"timestamp": "2020-12-29T10:15:39.598Z",
			"errorMessage": null,
			"message": "success"
		},
		"payload": {
			"pcf-sm-config-get-schema-response": {
				"resolved-payload": {
					"status": "success",
					"httpStatusCode": "200",
					"httpResponse": {
						"actionIdentifiers": {
							"mode": "sync",
							"blueprintName": "pcf-sm-rest-config",
							"blueprintVersion": "1.0.0",
							"actionName": "pcf-sm-config-get"
						},
						"payload": {
							"pcf-sm-config-get-request": {
								"pcf-sm-config-get-properties": {
								   "pcf-sm-url": "http://localhost:39001/pcf-config/v1/sm-config"
								}
							}
						},
						"commonHeader": {
							"subRequestId": "SUB_REQUEST_UUID",
							"requestId": "REQUEST_UUID",
							"originatorId": "SDNC_DG"
						}
					}
				}
			}
		}
	`
	raw := json.RawMessage(wfSchema)
	retJSON, _ := raw.MarshalJSON()
	w.Header().Set("content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(retJSON)
}

// GetCBAWorkflowSpec ...
func (c *CdsMockClient) GetCBAWorkflowSpec(w http.ResponseWriter, r *http.Request) {
	var jsonData workflowSpec
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&jsonData)
	if err != nil {
		log.Printf("Failed to parse json")
		log.Fatalln(err)
	}
	// Do nothng, print the json data
	fmt.Printf("json data %s", jsonData)

	cbaWorkflowSpec := `{
		"blueprintName": "pcf-sm-rest-config",
		"version": "1.0.0",
		"workFlowData": {
			"workFlowName": "pcf-sm-config-get",
			"inputs": {
				"resolution-key": {
					"required": false,
					"type": "string",
					"default": "pcf-sm-get"
				},
				"pcf-sm-url": {
					"required": true,
					"type": "string",
					"input-param": true
				},
				"pcf-sm-config-get-properties": {
					"description": "Dynamic PropertyDefinition for workflow(pcf-sm-config-get).",
					"required": true,
					"type": "dt-pcf-sm-config-get-properties"
				}
			},
			"outputs": {
				"resolved-payload": {
					"type": "string",
					"value": {
						"get_attribute": [
							"pcf-sm-config-get-api",
							"response-data"
						]
					}
				}
			}
		},
		"dataTypes": {
			"dt-pcf-sm-config-get-properties": {
				"description": "Dynamic DataType definition for workflow(pcf-sm-config-get).",
				"version": "1.0.0",
				"properties": {
					"pcf-sm-url": {
						"description": "",
						"required": true,
						"type": "string",
						"status": "",
						"constraints": [
							{}
						],
						"input-param": true,
						"entry_schema": {
							"type": ""
						}
					}
				},
				"derived_from": "tosca.datatypes.Dynamic"
			}
		}
	}`
	raw := json.RawMessage(cbaWorkflowSpec)
	retJSON, _ := raw.MarshalJSON()
	w.Header().Set("content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(retJSON)
}
