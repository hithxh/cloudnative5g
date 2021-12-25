#!/bin/bash

VM_CONFIG_JSON_FILE=${1}

CLUSTER_NAME=$(jq -r '.["clusters"]'[$i]'["cluster_name"]' $VM_CONFIG_JSON_FILE);

# Now open the ports for allowing REST API access to GKE pods
for port in `kubectl get svc -n amcop-system --output yaml | grep nodePort: | cut -d':' -f2` ; do gcloud compute firewall-rules create amcop-fw-rule-$port --allow tcp:$port ; done

cd $HOME/aarna-stream/cnf/payload
#gcloud compute scp amcop-kud:~/.kube/config ./edge_k8s_config

# This will be used in further scripts
export CLOUD_CLUSTER=1

#Create firewall rules for the two clusters to talk
#Get the GKE node for our cluster
CNODE=$(gcloud compute instances list  | grep $CLUSTER_NAME | head -n 1 | awk '{ print $1 }')

#Do a dummy command to make sure that the keys are in place
DUMMYCMD=$(gcloud compute ssh $CNODE --command="ls /")

#Find a range of internal address, GKE uses cbr0 as the network
IPRANGE=$(gcloud compute ssh $CNODE --command="ip a | grep eth0 | grep inet | cut -d'/' -f 1 | cut -d't' -f2 ")

echo " IP range is :$IPRANGE"

IP_RANGE=$(echo $IPRANGE | awk -F"." '{print $1"."$2"."$3".0"}')
CIDR_RANGE="$IP_RANGE/16"

#Add firewall entry to allow access to internal address
gcloud compute firewall-rules create amcop-kud-access --allow tcp,udp,icmp,esp,ah,sctp --source-ranges="${CIDR_RANGE}"
