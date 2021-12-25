package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"example.com/configsvc/app"
	"example.com/configsvc/db"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

/* This is the main package of the configuration service.
 */
func main() {
	svcHandler := app.NewAppHandler()
	configFile, err := os.Open("/opt/emco/config/configsvc.conf")
	//configFile, err := os.Open("configsvc.conf")
	if err != nil {
		fmt.Printf("Failed to read config service configuration")
		return
	}
	defer configFile.Close()

	// Read the configuration json
	byteValue, _ := ioutil.ReadAll(configFile)
	json.Unmarshal(byteValue, &svcHandler.ConfigSvcConf)

	// Connect to the DB
	fmt.Printf("Config %s\n", svcHandler.ConfigSvcConf)
	err = db.CreateDBClient("mongo", "mco", svcHandler.ConfigSvcConf.Mongo)
	if err != nil {
		fmt.Println("Failed to connect to DB %s", err)
		return
	}
	// Store the CDS end point.
	svcHandler.CdsIface.CdsEndpoint = svcHandler.ConfigSvcConf.Cds

	// Get an instance of the OrchestrationHandler, this type implements
	// the APIs i.e CreateApp, ShowApp, DeleteApp.
	httpRouter := mux.NewRouter().PathPrefix("/configsvc").Subrouter()
	loggedRouter := handlers.LoggingHandler(os.Stdout, httpRouter)
	log.Println("Starting config service")

	httpServer := &http.Server{
		Handler:      loggedRouter,
		Addr:         ":" + svcHandler.ConfigSvcConf.OwnPort,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	httpRouter.HandleFunc("/healthcheck", svcHandler.GetHealth).Methods("GET")

	// NG API to get workflows
	//svcHandler.CdsIface.CdsEndpoint = svcHandler.ConfigSvcConf.OwnEndpoint
	httpRouter.HandleFunc("/getWorkflows", svcHandler.CdsIface.GetAllWorkflow).Methods("GET")
	//httpRouter.HandleFunc("/getConfig/{bpName}/{bpVersion}/{wfName}", svcHandler.CdsIface.GetConfig).Methods("GET")
	httpRouter.HandleFunc("/{bpName}/{bpVersion}/{wfName}", svcHandler.CdsIface.GetConfig).Queries("nf-url", "{nf-url}")
	httpRouter.HandleFunc("/{bpName}/{bpVersion}/{wfName}", svcHandler.CdsIface.GetConfig).Methods("GET")
	httpRouter.HandleFunc("/appBps", svcHandler.CdsIface.StoreAppBps).Methods("POST")
	httpRouter.HandleFunc("/{compApp}/{compVersion}/{appName}/bp", svcHandler.CdsIface.GetAppWorkflows).Methods("GET")
	httpRouter.HandleFunc("/{compApp}/{compVersion}/{appName}/bp", svcHandler.CdsIface.GetAppWorkflows).Queries("type", "{type}")
	httpRouter.HandleFunc("/{bpName}/{bpVersion}/{wfName}", svcHandler.CdsIface.PostConfig).Methods("POST")
	httpRouter.HandleFunc("/{bpName}/{bpVersion}/{wfName}", svcHandler.CdsIface.DeleteConfig).Methods("DELETE")

	// Start server in a go routine.
	go func() {
		log.Fatal(httpServer.ListenAndServe())
	}()

	// Gracefull shutdown of the server,
	// create a channel and wait for SIGINT
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	log.Println("wait for signal")
	<-c
	log.Println("Bye Bye")
	httpServer.Shutdown(context.Background())
}
