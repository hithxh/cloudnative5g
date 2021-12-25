#!/bin/sh
export KEYCLOAK_PORT=$(kubectl -n keycloak get svc keycloak -o jsonpath='{.spec.ports[?(@.name=="http")].nodePort}')
export MIDDLEEND_PORT=30481
export HOST_IP=$(kubectl get po -l istio=ingressgateway -n istio-system -o jsonpath='{.items[0].status.hostIP}')

export AUTHPROXY_ISSUER=http://$HOST_IP:$KEYCLOAK_PORT/auth/realms/EMCO/
export AUTHPROXY_REDIRECT_URI=http://$HOST_IP:$MIDDLEEND_PORT/middleend/callback

cd $HOME/aarna-stream/onap4k8s-ui/helm
helm install emcoui emcoui -n onap4k8s --set authproxy.issuer=$AUTHPROXY_ISSUER --set authproxy.redirect_uri=$AUTHPROXY_REDIRECT_URI
