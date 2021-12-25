#!/bin/bash

# This script will create a cluster, before running this please make sure that
# gcloud init has been done.

if [ "$#" -lt 1 ]
then
   echo "Usage : $0 <cluster-name>"
   exit
fi

CLUS_NAME=$1

#Delete the old kubeconfig
rm -rf ~/.kube/*

gcloud container clusters create ${CLUS_NAME} --zone us-central1-f --enable-autoscaling --max-nodes 15 --no-enable-autoupgrade
# We wait for the cluster to be ready
sleep 20
gcloud container clusters get-credentials ${CLUS_NAME}
sleep 5
kubectl get pod --all-namespaces
kubectl get nodes

kubectl -n kube-system create serviceaccount tiller

kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

helm init --service-account tiller

kubectl -n kube-system  rollout status deploy/tiller-deploy


