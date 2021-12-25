#!/bin/bash

# This script will create a kubernetes cluster on Amazon EKS

if [[ "X$1" == "X" ]]
then 
CLUSTER_NAME=amcop
else
CLUSTER_NAME=${1}
fi

# Create a cluster now
eksctl create cluster --region us-east-1 --ssh-access --zones us-east-1f,us-east-1c --name ${CLUSTER_NAME}

# We wait for all the nodes to come up
sleep 60

kubectl -n kube-system create serviceaccount tiller

kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

helm init --service-account tiller

kubectl -n kube-system  rollout status deploy/tiller-deploy
