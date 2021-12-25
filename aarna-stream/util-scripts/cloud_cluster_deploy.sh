#!/bin/bash

# This script will deploy AMCOP on a k8s cluster. The cluster could be a GKE or AKS.
# Please note that this script should be run from aarna-stream/util-scripts DIR only
CUR_DIR=`pwd`

# Now install the onap4k8s components
if [ ! -d /tmp/multicloud-k8s ]
then
	cd /tmp/
	git clone https://github.com/onap/multicloud-k8s.git
fi

# Deploy the K8s pods now

cd /tmp/multicloud-k8s/deployments/kubernetes/

kubectl create ns onap4k8s

kubectl apply -f onap4k8sdb.yaml -n onap4k8s

kubectl apply -f onap4k8s.yaml -n onap4k8s

# Check the pods

kubectl get pod -n onap4k8s

# Now deploy the emco UI
cd ${CUR_DIR}

cd ../onap4k8s-ui/

# We replace the image path with what we have stored in GCP container registery
#sed -i 's/image:.*/image: gcr.io\/onap-177920\/emcoui\:1.3.3/g' algui.yaml

# At this point we want to associate the secret for accessing the gcr.io 
#kubectl create secret docker-registry amcop-img-access --docker-server=https://gcr.io --docker-username=_json_key --docker-email=user@example.com --docker-password="$(cat $HOME/aarna-stream/anod_lite/resources/anod-guest.json)"

#kubectl create secret docker-registry amcop-img-access --docker-server=https://gcr.io --docker-username=_json_key --docker-email=user@example.com --docker-password="$(cat $HOME/aarna-stream/anod_lite/resources/anod-guest.json)" -n onap4k8s

# Patch default serviceaccount to use the GCR.io secret  
#kubectl patch serviceaccount default -p "{\"imagePullSecrets\": [{\"name\": \"amcop-img-access\"}]}"

# Now we deploy the EMCO UI pods
#kubectl apply -f ./algui.yaml -n onap4k8s

# EMCO UI and Middleend changes
cd $HOME//aarna-stream/onap4k8s-ui/helm
helm install emcoui --name emcoui --namespace onap4k8s

kubectl apply -f ~/aarna-stream/middle_end/middleend.yaml -n onap4k8s

# Dump all pods
kubectl get pods -n onap4k8s

# Wait for all services to come up
sleep 10

# Now expose the emcoui service through external IP
kubectl expose deployment emcoui --type=LoadBalancer --name=emcoui-gui -n onap4k8s

echo "Waiting for the external IP to be available ......... "
# Wait for the external IP to be ready
sleep 60

# Now print the IP address of the external service that we created
EXTERNAL_IP=` kubectl get svc -n onap4k8s | grep emcoui-gui | awk '{ print $4 }'`

echo "IP to access the emco GUI: $EXTERNAL_IP"

