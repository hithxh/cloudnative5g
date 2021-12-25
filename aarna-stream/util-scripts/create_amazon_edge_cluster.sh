#!/bin/bash

# This script will create a kubernetes cluster on Amazon EKS

if [[ "X$1" == "X" ]]
then 
CLUSTER_NAME=amcop
else
CLUSTER_NAME=${1}
fi

#Get VPC id
VPCID=`aws eks describe-cluster --name amcop --output text --query 'cluster.resourcesVpcConfig.vpcId'`

#Get the subnets, seperated by ',' we will use them to create the edge cluster
PUBLIC_SUBNET=`aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPCID}" --query 'Subnets[].[MapPublicIpOnLaunch, SubnetId, VpcId]'  --output text | grep True | awk '{ print $2 }' | tr '\n' ',' | sed '$ s/,$//g'`
PVT_SUBNET=`aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPCID}" --query 'Subnets[].[MapPublicIpOnLaunch, SubnetId, VpcId]'  --output text | grep -v True | awk '{ print $2 }' | tr '\n' ',' | sed '$ s/,$//g'`

# Create a cluster now
#eksctl create cluster --region us-east-1 --ssh-access --vpc-private-subnets subnet-07b781dafee2629b5,subnet-08fb5c4514d1e7969 --vpc-public-subnets subnet-03c40c8104e134faf,subnet-0fd5d77bb5074528a  --name ${CLUSTER_NAME}
eksctl create cluster --region us-east-1 --ssh-access --vpc-private-subnets ${PVT_SUBNET} --vpc-public-subnets ${PUBLIC_SUBNET}  --name ${CLUSTER_NAME}

# We wait for all the nodes to come up
sleep 60

kubectl -n kube-system create serviceaccount tiller

kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller

helm init --service-account tiller

kubectl -n kube-system  rollout status deploy/tiller-deploy
