#!/bin/bash

# Set the needed parameter
USER=${REALM_ADMIN:-admin}
PASSWORD=${REALM_PASSWD:-admin}
GRANT_TYPE=password
CLIENT_ID=admin-cli
KEYCLOAK_URL=${KEYCLOAK_URL:-"localhost:8080"}

###Exporting all the  environment variables and create realm
export KEYCLOAK_PORT=$(kubectl -n keycloak get svc keycloak -o jsonpath='{.spec.ports[?(@.name=="http")].nodePort}')
export MIDDLEEND_PORT=30481
export INGRESS_PORT=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
export HOST_IP=$(kubectl get po -l istio=ingressgateway -n istio-system -o jsonpath='{.items[0].status.hostIP}')

export KEYCLOAK_URL=$HOST_IP:$KEYCLOAK_PORT
export ROOT_URL=http://$HOST_IP:$INGRESS_PORT
export ADMIN_URL=$ROOT_URL
export WEBORIGINS_URL=$ROOT_URL/*
export REDIRECT_URL=http://$HOST_IP:$MIDDLEEND_PORT/middleend/callback

echo $KEYCLOAK_URL
echo $ROOT_URL
echo $REDIRECT_URL

#####################

echo "------------------------------------------------------------------------"
echo "KEYCLOAK_URL is: http://$KEYCLOAK_URL"
echo "------------------------------------------------------------------------"
echo ""

# create realm json with deployment specific URLs
echo "------------------------------------------------------------------------"
echo "Creating emco_realm.json using env ROOT_URL: $ROOT_URL, ADMIN_URL: $ADMIN_URL, REDIRECT_URL: $REDIRECT_URL, WEBORIGINS_URL: $WEBORIGINS_URL"
echo "------------------------------------------------------------------------"
echo ""

jq '.clients[0].rootUrl=env.ROOT_URL |
	 .clients[0].adminUrl=env.admin_url |
	 .clients[0].redirectUris[0]=env.REDIRECT_URL |
	 .clients[0].webOrigins[0]=env.WEBORIGINS_URL' realm_emco_template.json > realm_emco.json

# Get the bearer token from Keycloak
echo "------------------------------------------------------------------------"
echo "Get the bearer token from Keycloak"
echo "------------------------------------------------------------------------"
echo ""
access_token=$( curl -d "client_id=$CLIENT_ID" -d "username=$USER" -d "password=$PASSWORD" -d "grant_type=$GRANT_TYPE" "http://$KEYCLOAK_URL/auth/realms/master/protocol/openid-connect/token" | sed -n 's|.*"access_token":"\([^"]*\)".*|\1|p')

echo "------------------------------------------------------------------------"
echo "Token from Keycloak"
echo $access_token
echo "------------------------------------------------------------------------"
echo ""

# Create the realm in Keycloak
echo "------------------------------------------------------------------------"
echo "Create the realm in Keycloak"
echo "------------------------------------------------------------------------"
echo ""

result=$(curl -v -d @./realm_emco.json -H "Content-Type: application/json" -H "Authorization: bearer $access_token" "http://$KEYCLOAK_URL/auth/admin/realms")
echo $result
if [ "$result" = "" ]; then
echo "------------------------------------------------------------------------"
echo "The realm is created."
echo "------------------------------------------------------------------------"
else
echo "------------------------------------------------------------------------"
echo "It seems there is a problem with the realm creation: $result"
echo "------------------------------------------------------------------------"
fi
