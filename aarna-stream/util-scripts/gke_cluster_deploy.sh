#!/bin/bash

# This script will deploy AMCOP on a GKE cluster. It will first create the cluster and then deploy
# all components on it.
# Please note that this script should be run from aarna-stream/util-scripts DIR only

if [ "X$1" == "X" ];
then
  ID=7
else
  ID=$1
fi

# Get the cluser name from the config file
CLUSTER_NAME="amcop-vm-01"

#Add support to access the docker images
gcloud auth configure-docker -q

# Create a KUD cluster for orchestrating the CNF
#./create_gke_kud.sh amcop-kud $ANOD_LITE_LOG_FOLDER &

# Create cluster
./create_gke_cluster.sh $CLUSTER_NAME

# Deploy the pods onto the cluster
./cloud_cluster_deploy.sh

# Now open the ports for allowing REST API access to GKE pods
for port in `kubectl get svc -n onap4k8s --output yaml | grep nodePort: | cut -d':' -f2` ; do gcloud compute firewall-rules create amcop-fw-rule-$port --allow tcp:$port ; done

# Wait for KUD cluster create 
#wait

# Check if kud cluster is ready
#COUNT=`gcloud compute ssh amcop-kud --command="kubectl get pod --all-namespaces | grep Running | wc -l"`

#if [[ $COUNT -lt 18 ]]; then
	# Wait for few more minutes before retry
# 	echo "Waiting for the KUD cluster to be ready ..........."
#	sleep 180
#fi

cd ~/aarna-stream/cnf/payload
#gcloud compute scp amcop-kud:~/.kube/config ./edge_k8s_config

# This will be used in further scripts 
export CLOUD_CLUSTER=1

#Create firewall rules for the two clusters to talk
#Get the GKE node for our cluster
CNODE=$(gcloud compute instances list  | grep $CLUSTER_NAME | head -n 1 | awk '{ print $1 }')

#Do a dummy command to make sure that the keys are in place
DUMMYCMD=$(gcloud compute ssh $CNODE --command="ls /")

#Find a range of internal address, GKE uses cbr0 as the network
IPRANGE=$(gcloud compute ssh $CNODE --command="ip a | grep cbr0 | grep inet | cut -d'/' -f 1 | cut -d't' -f2 ")

echo " IP range is :$IPRANGE"

IP_RANGE=$(echo $IPRANGE | awk -F"." '{print $1"."$2"."$3".0"}')
CIDR_RANGE="$IP_RANGE/32"

#Add firewall entry to allow access to internal address
gcloud compute firewall-rules create amcop-kud-access --allow tcp,udp,icmp,esp,ah,sctp --source-ranges="${CIDR_RANGE}"

