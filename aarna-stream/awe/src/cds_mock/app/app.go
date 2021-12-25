package app

import (
	"net/http"
)

//ConfigSvcConfig ... The configmap of the middleent
type ConfigSvcConfig struct {
	OwnPort     string `json:"ownport"`
}

//ConfigSvcHandler ... handler, handling the service configurations
type ConfigSvcHandler struct {
	ConfigSvcConf ConfigSvcConfig
	CdsMclient    *CdsMockClient
}

//NewAppHandler ... return the config service handler
func NewAppHandler() *ConfigSvcHandler {
	c := ConfigSvcHandler{}
	c.CdsMclient = GetCBAMockClient()
	return &ConfigSvcHandler{}
}

// GetHealth to check connectivity
func (h ConfigSvcHandler) GetHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
