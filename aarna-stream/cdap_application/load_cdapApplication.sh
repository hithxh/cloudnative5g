CDAP_HOST=10.20.249.97:31015

NAMESPACE=cdap_closedloop

curl -X PUT http://$CDAP_HOST/v3/namespaces/$NAMESPACE
curl -X POST --data-binary @CDAPAnalyticApplication-1.0.jar http://$CDAP_HOST/v3/namespaces/$NAMESPACE/artifacts/CDAPAnalyticApplication
curl -X PUT -d @app_config.json http://$CDAP_HOST/v3/namespaces/$NAMESPACE/apps/AnalyticApplication
curl -X PUT -d @app_preferences.json http://$CDAP_HOST/v3/namespaces/$NAMESPACE/apps/AnalyticApplication/preferences
curl -X POST http://$CDAP_HOST/v3/namespaces/$NAMESPACE/apps/AnalyticApplication/workers/KafkaSubscriberWorker/start
curl -X POST http://$CDAP_HOST/v3/namespaces/$NAMESPACE/apps/AnalyticApplication/flows/VesCollectorFlow/start
