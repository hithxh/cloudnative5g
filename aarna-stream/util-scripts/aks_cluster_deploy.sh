#!/bin/bash

# This script will deploy AMCOP on a AKS cluster. It will first create the cluster and then deploy
# all components on it.
# Please note that this script should be run from aarna-stream/util-scripts DIR only
VM_CONFIG_JSON_FILE=${1}
ANOD_LITE_LOG_FOLDER=${2}

# Get the cluser name from the config file
CLUSTER_NAME=$(jq -r '.["clusters"]'[$i]'["cluster-name"]' $VM_CONFIG_JSON_FILE);

# Create cluster, this will also create a resource group for the KUD VM
./create_azure_cluster.sh $CLUSTER_NAME 2>&1 >$ANOD_LITE_LOG_FOLDER/create_aks_cluster.lo 

# Create a KUD cluster for orchestrating the CNF
./create_aks_kud.sh 2>&1 >$ANOD_LITE_LOG_FOLDER/aks_kud_cluster.log

# Deploy the pods onto the cluster
./cloud_cluster_deploy.sh 2>&1 >$ANOD_LITE_LOG_FOLDER/aks_cluster_deploy.log

# Get the IP address to copy files
IPADDR=`az vm list --show-details -o=table  | grep amcop-kud | awk '{ print $5 }'`
ssh aarna@${IPADDR} "mkdir -p /home/aarna/vfw_demo"

scp  ~/.kube/config aarna@${IPADDR}:/home/aarna/vfw_demo/

# This will be used in further scripts 
export CLOUD_CLUSTER=2
