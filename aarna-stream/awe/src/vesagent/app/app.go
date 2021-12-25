package app

import (
	"encoding/json"
	"fmt"
	"strings"
	"net/http"
	"bytes"
	"io/ioutil"
	"github.com/google/uuid"
)

//VesAgentConfig ... The configmap of the middleent
type VesAgentConfig struct {
	OwnPort      string `json:"ownport"`
	VesCollector string `json:"vescollector"`
}

//VesAgentHandler ... handler, handling the service configurations
type VesAgentHandler struct {
	VesAgentConf VesAgentConfig
	client       http.Client
}

//NewAppHandler ... return the config service handler
func NewAppHandler() *VesAgentHandler {
	v := VesAgentHandler{}
	v.client = http.Client{}
	return &v
}

// GetHealth to check connectivity
func (h VesAgentHandler) GetHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}


type NotificationFields struct {
	NotificationFieldsVersion string           `json:"notificationFieldsVersion"`
	ChangeType                string           `json:"changeType"`
	ChangeIdentifier          string           `json:"changeIdentifier"`
	NotifAdditionalFields     map[string]interface {}`json:"additionalFields"`
}

type CommonEventHeader struct {
	Version                 string `json:"version"`
	VesEventListenerVersion string `json:"vesEventListenerVersion"`
	Domain                  string `json:"domain"`
	EventName               string `json:"eventName"`
	EventID                 string `json:"eventId"`
	Sequence                int    `json:"sequence"`
	Priority                string `json:"priority"`
	ReportingEntityID       string `json:"reportingEntityId"`
	ReportingEntityName     string `json:"reportingEntityName"`
	SourceID                string `json:"sourceId"`
	SourceName              string `json:"sourceName"`
	NfVendorName            string `json:"nfVendorName"`
	NfNamingCode            string `json:"nfNamingCode"`
	NfcNamingCode           string `json:"nfcNamingCode"`
	StartEpochMicrosec      int64  `json:"startEpochMicrosec"`
	LastEpochMicrosec       int64  `json:"lastEpochMicrosec"`
	TimeZoneOffset          string `json:"timeZoneOffset"`
}

type VesEvent struct {
	Event struct {
		EventHeader CommonEventHeader  `json:"commonEventHeader"`
		Fields      NotificationFields `json:"notificationFields"`
	} `json:"event"`
}

func (h *VesAgentHandler) parsePayload(src map[string]interface{}, pkey string) string {
	for k := range src {
		if k == pkey {
			return src[k].(string)
		}
		// recursive if map again
		newMap, isMap := src[k].(map[string]interface{})
		if !isMap {
			continue
		}
		h.parsePayload(newMap, pkey)
	}
	return "notFound"
}

func (h *VesAgentHandler) VesMessage(event map[string]interface{}) interface{} {
	// Look for the type key in the message
	chType := "type-notFound"
	chTypeVal := h.parsePayload(event, "type")
	if (chTypeVal != "notFound"){
		chType = chTypeVal
	}

	eventName := "Notification_unknown"
	eventDetail := h.parsePayload(event, "detail")
	if strings.Contains(eventDetail, "SM Policy Configuration Not Found") {
		eventName = "Notification_PDU_SessionRegistrationFailed"
	}

	field := NotificationFields{
		NotificationFieldsVersion: "2.0",
		ChangeType:                chType,
		ChangeIdentifier:          chType,
		NotifAdditionalFields:     event,
	}

	eventID := fmt.Sprintf("%s", uuid.New())

	vesheader := CommonEventHeader{
		Version:                 "4.0.1",
		VesEventListenerVersion: "7.0.1",
		Domain:                  "notification",
		EventName:               eventName,
		EventID:                 eventID,
		Sequence:                0,
		Priority:                "Normal",
		ReportingEntityID:       "cc305d54-75b4-431b-adb2-eb6b9e541234",
		ReportingEntityName:     "ibcx0001vm002oam001",
		SourceID:                "de305d54-75b4-431b-adb2-eb6b9e546014",
		SourceName:              "ibcx0001vm002ssc001",
		NfVendorName:            "XYZ",
		NfNamingCode:            "ibcx",
		NfcNamingCode:           "ssc",
		StartEpochMicrosec:      0,
		LastEpochMicrosec:       0,
		TimeZoneOffset:          "UTC-05:30",
	}
	vesevent := VesEvent{}
	vesevent.Event.EventHeader = vesheader
	vesevent.Event.Fields = field
	fmt.Printf("ves %s\n", vesevent)

	return vesevent
}

func (h *VesAgentHandler) SendToVesCollector(jsonData []byte) interface{} {
	url := "http://" + h.VesAgentConf.VesCollector + "/eventListener/v7"

	request, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	request.Header.Set("Content-Type", "application/json")
	resp, err := h.client.Do(request)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 202 {
		return resp.StatusCode
	}
	fmt.Printf("Response received from ves for %s", resp.StatusCode)
	return nil
}

func (h *VesAgentHandler) HandleNotifications(w http.ResponseWriter, r *http.Request) {
	event := map[string]interface{}{}
	reqBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.Write([]byte("Failed to read Request body"))
		w.WriteHeader(500)
		return
	}

	err = json.Unmarshal(reqBody, &event)
	if err != nil {
		msg := fmt.Sprintf("Failed to parse json", err.Error())
		w.Write([]byte(msg))
		w.WriteHeader(500)
		return
	}

	vesMessage := h.VesMessage(event)

	jsonLoad, _ := json.Marshal(vesMessage)
	fmt.Printf("%s", jsonLoad)
	status := h.SendToVesCollector(jsonLoad)
	if status != nil {
		if intval, ok := status.(int); ok {
			w.WriteHeader(intval)
		}else {
			w.WriteHeader(500)
		}
		return
	}

	w.WriteHeader(200)
	return
}
