#!/bin/bash

# This script will create a kubernetes cluster on Azure 
CLUSTER_NAME=${1}
# First we create a resource group 
az group create --name amcop-cluster-group --location eastus

#Create a vnet for connecting with the KUD cluster
az network vnet create  --resource-group amcop-cluster-group --name amcop-aks-vnet --address-prefix 10.20.0.0/16 --subnet-name amcop-subnet --subnet-prefix 10.20.0.0/24

# Get the subnet id for the vnet
SID=`az network vnet subnet list     --resource-group amcop-cluster-group     --vnet-name amcop-aks-vnet --query "[0].id" --output tsv`


# Check if OperationManagement and insight is registered. IF not use below command to register them.
#az provider show -n Microsoft.OperationsManagement -o table
#az provider show -n Microsoft.OperationalInsights -o table
#az provider register --namespace Microsoft.OperationsManagement
#az provider register --namespace Microsoft.OperationalInsights

# Create a cluster now
az aks create --resource-group amcop-cluster-group --name $CLUSTER_NAME --node-count 3 --enable-addons monitoring --network-plugin azure --vnet-subnet-id ${SID} --generate-ssh-keys --yes -y

# We wait for all the nodes to come up
sleep 60

# Get the kubeconfig file, at this point we assume that kubectl is already installed on the sytem
az aks get-credentials --resource-group amcop-cluster-group --name $CLUSTER_NAME --overwrite-existing

kubectl -n kube-system create serviceaccount tiller

kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

helm init --service-account tiller

kubectl -n kube-system  rollout status deploy/tiller-deploy
