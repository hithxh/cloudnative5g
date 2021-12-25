#!/bin/bash

# This script will create a kubernetes cluster on Azure 
CLUSTER_NAME=amcop-edge
# We assume the cluster group to be amcop-cluster-group
# Get the subnet id for the vnet, vnet must be created in a previous step where we deploy amcop
SID=`az network vnet subnet list --resource-group amcop-cluster-group --vnet-name amcop-aks-vnet --query "[0].id" --output tsv`

# Create a cluster now
az aks create --resource-group amcop-cluster-group --name $CLUSTER_NAME --node-count 3 --enable-addons monitoring --network-plugin azure --vnet-subnet-id ${SID} --generate-ssh-keys

# We wait for all the nodes to come up
sleep 60

# Get the kubeconfig file, at this point we assume that kubectl is already installed on the sytem
az aks get-credentials --resource-group amcop-cluster-group --name $CLUSTER_NAME --overwrite-existing

kubectl -n kube-system create serviceaccount tiller

kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

helm init --service-account tiller

kubectl -n kube-system  rollout status deploy/tiller-deploy
