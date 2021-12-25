#!/bin/bash

# This script will deploy AMCOP on a Amazon EKS cluster. It will first create the cluster and then deploy
# all components on it.
# Please note that this script should be run from aarna-stream/util-scripts DIR only

# Create AMCOP cluster 
./create_amazon_cluster.sh amcop

sleep 10

# Deploy the pods onto the cluster
./cloud_cluster_deploy.sh 

