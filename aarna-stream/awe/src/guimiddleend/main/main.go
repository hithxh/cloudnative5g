package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"os/signal"
	"time"

	"example.com/middleend/app"
	"example.com/middleend/authproxy"
	"example.com/middleend/db"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	log "github.com/sirupsen/logrus"
)

func init() {
	// Log as JSON instead of the default ASCII formatter.
	log.SetFormatter(&log.JSONFormatter{})

	// Output to stdout instead of the default stderr
	log.SetOutput(os.Stdout)
}

/* This is the main package of the middleend. This package
 * implements the http server which exposes service ar 9891.
 * It also intialises an API router which handles the APIs with
 * subpath /v1.
 */
func main() {
	depHandler := app.NewAppHandler()
	authProxyHandler := authproxy.NewAppHandler()

	configFile, err := os.Open("/opt/emco/config/middleend.conf")
	if err != nil {
		log.Error("Failed to read middleend configuration")
		return
	}
	defer configFile.Close()

	// Read the configuration json
	byteValue, _ := ioutil.ReadAll(configFile)
	json.Unmarshal(byteValue, &depHandler.MiddleendConf)
	json.Unmarshal(byteValue, &authProxyHandler.AuthProxyConf)

	// parse string, this is built-in feature of logrus
	logLevel, err := log.ParseLevel(depHandler.MiddleendConf.LogLevel)
	if err != nil {
		logLevel = log.DebugLevel
	}

	// set global log level
	log.SetLevel(logLevel)

	// Connect to the DB
	err = db.CreateDBClient("mongo", "mind", depHandler.MiddleendConf.Mongo)
	if err != nil {
		log.Error("Failed to connect to DB")
		return
	}

	depHandler.MiddleendConf.StoreName = "middleend"
	// Get an instance of the OrchestrationHandler, this type implements
	// the APIs i.e CreateApp, ShowApp, DeleteApp.
	httpRouter := mux.NewRouter().PathPrefix("/middleend").Subrouter()
	loggedRouter := handlers.LoggingHandler(os.Stdout, httpRouter)
	log.Info("Starting middle end service")
	log.WithFields(log.Fields{
		"ownport":      depHandler.MiddleendConf.OwnPort,
		"orchestrator": depHandler.MiddleendConf.OrchService,
		"clm":          depHandler.MiddleendConf.Clm,
		"dcm":          depHandler.MiddleendConf.Dcm,
		"ovnaction":    depHandler.MiddleendConf.OvnService,
		"configSvc":    depHandler.MiddleendConf.CfgService,
		"mongo":        depHandler.MiddleendConf.Mongo,
		"logLevel":     depHandler.MiddleendConf.LogLevel,
		"storeName":    depHandler.MiddleendConf.StoreName,
	}).Infof("Middle End Configuration")

	httpServer := &http.Server{
		Handler:      loggedRouter,
		Addr:         ":" + depHandler.MiddleendConf.OwnPort,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	httpRouter.HandleFunc("/healthcheck", depHandler.GetHealth).Methods("GET")

	// Middle end APIs for draft feature
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/checkout",
		depHandler.CreateDraftCompositeApp).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/versions",
		depHandler.GetSvcVersions).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/versions/",
		depHandler.GetSvcVersions).Queries("state", "{state}")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/app",
		depHandler.UpdateCompositeApp).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/apps/{app-name}",
		depHandler.RemoveApp).Methods("DELETE")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/update",
		depHandler.CreateService).Methods("POST")

	// POST, GET, DELETE composite apps
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps", depHandler.CreateApp).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}",
		depHandler.GetSvc).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps",
		depHandler.GetSvc).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps",
		depHandler.GetSvc).Queries("filter", "{filter}")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}",
		depHandler.DelSvc).Methods("DELETE")

	// POST, GET, DELETE deployment intent groups
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups",
		depHandler.CreateDig).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/deployment-intent-groups", depHandler.GetAllDigs).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups",
		depHandler.GetAllDigs).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}",
		depHandler.GetAllDigs).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}",
		depHandler.DelDig).Methods("DELETE")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/",
		depHandler.DelDig).Queries("operation", "{operation}").Methods("DELETE")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/status",
		depHandler.GetDigStatus).Methods("GET")

	// DIG migrate/update/rollback related APIs
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/checkout",
		depHandler.GetDigInEdit).Methods("GET")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/checkout",
		depHandler.CheckoutDIG).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/checkout/",
		depHandler.CheckoutDIG).Queries("operation", "{operation}").Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/checkout/submit",
		depHandler.UpgradeDIG).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/checkout",
		depHandler.DigUpdateHandler).Methods("PUT")
	httpRouter.HandleFunc("/projects/{project-name}/composite-apps/{composite-app-name}/{version}/deployment-intent-groups/{deployment-intent-group-name}/checkout/",
		depHandler.DigUpdateHandler).Queries("operation", "{operation}").Methods("PUT")

	// Authproxy related APIs
	httpRouter.HandleFunc("/login", authProxyHandler.LoginHandler).Methods("GET")
	httpRouter.HandleFunc("/callback", authProxyHandler.CallbackHandler).Methods("GET")
	httpRouter.HandleFunc("/auth", authProxyHandler.AuthHandler).Methods("GET")
	// Cluster createion API
	httpRouter.HandleFunc("/cluster-providers/{cluster-provider-name}/clusters", depHandler.CheckConnection).Methods("POST")
	httpRouter.HandleFunc("/all-clusters", depHandler.GetClusters).Methods("GET")

	//GET dashboard
	httpRouter.HandleFunc("/projects/{project-name}/dashboard", depHandler.GetDashboardData).Methods("GET")

	// Logical Cloud related APIs
	httpRouter.HandleFunc("/projects/{project-name}/logical-clouds", depHandler.CreateLogicalCloud).Methods("POST")
	httpRouter.HandleFunc("/projects/{project-name}/logical-clouds", depHandler.GetLcReferences).Methods("GET")

	// Get cluster networks
	httpRouter.HandleFunc("/cluster-providers/{clusterprovider-name}/clusters/{cluster-name}/networks", depHandler.GetClusterNetworks).Methods("GET")


	// Start server in a go routine.
	go func() {
		log.Fatal(httpServer.ListenAndServe())
	}()

	// Gracefull shutdown of the server,
	// create a channel and wait for SIGINT
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	log.Info("wait for signal")
	<-c
	log.Info("Bye Bye")
	httpServer.Shutdown(context.Background())
}
