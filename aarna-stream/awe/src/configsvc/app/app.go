package app

import (
	"net/http"
)

//ConfigSvcConfig ... The configmap of the middleent
type ConfigSvcConfig struct {
	OwnPort     string `json:"ownport"`
	Mongo       string `json:"mongo"`
	CdsMock	string `json:"cdsmock"`
	Cds string `json:"cds"`
}

//ConfigSvcHandler ... handler, handling the service configurations
type ConfigSvcHandler struct {
	ConfigSvcConf ConfigSvcConfig
	CdsIface      *CdsInterface
}

//NewAppHandler ... return the config service handler
func NewAppHandler() *ConfigSvcHandler {
	c := ConfigSvcHandler{}
	c.CdsIface = GetCdsInterface()
	return &c
}

// GetHealth to check connectivity
func (h ConfigSvcHandler) GetHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
