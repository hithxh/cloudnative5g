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

	"example.com/vesagent/app"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

/* This is the main package of the configuration service.
 */
func main() {
	vesHandler := app.NewAppHandler()
	configFile, err := os.Open("/opt/emco/config/vesagent.conf")
	if err != nil {
		fmt.Printf("Failed to read config service configuration")
		return
	}
	defer configFile.Close()

	// Read the configuration json
	byteValue, _ := ioutil.ReadAll(configFile)
	json.Unmarshal(byteValue, &vesHandler.VesAgentConf)

	// Get an instance of the OrchestrationHandler, this type implements
	// the APIs i.e CreateApp, ShowApp, DeleteApp.
	httpRouter := mux.NewRouter().PathPrefix("/vesagent").Subrouter()
	loggedRouter := handlers.LoggingHandler(os.Stdout, httpRouter)
	log.Println("Starting config service")

	httpServer := &http.Server{
		Handler:      loggedRouter,
		Addr:         ":" + vesHandler.VesAgentConf.OwnPort,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	httpRouter.HandleFunc("/healthcheck", vesHandler.GetHealth).Methods("GET")
	httpRouter.HandleFunc("/notifications/{version}/notify/{notif-id}", vesHandler.HandleNotifications).Methods("POST")

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
