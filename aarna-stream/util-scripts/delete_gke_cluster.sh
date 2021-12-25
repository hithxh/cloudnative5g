#!/bin/bash

# If you have a custom name pass it else the default cluster is anod-cluster-7

#if [ "X$1" == "X" ]
#then
#	CLUS=amcop-cluster-01
#else
#	CLUS=$1
#fi
VM_CONFIG_JSON_FILE=${1}
ANOD_LITE_LOG_FOLDER=${2}

interactive=0

if [ $# -lt 2 ]
then
  echo;echo
  echo "$0 <config_file_path> <log_folder_path>"
  echo "Insufficient arguments...entering interactive mode"
  interactive=1
else
  cluster=$(jq -r '."deployment_configs"."emco_config"."cluster_ref_name"' $VM_CONFIG_JSON_FILE);
fi

if [ $interactive -eq 1 ]
then
  read -p "Enter the cluster name: " cluster 
 CLUS=$1
fi

CLUS=$cluster
echo "Cluster name is : $CLUS"

gcloud container clusters delete $CLUS --quiet

#gcloud compute instances delete amcop-kud --quiet

# Remove all the firewall rules

# for rule in `gcloud compute firewall-rules list --quiet 2> /dev/null | grep amcop-fw-rule | awk '{ print $1 }'` ; do
#	gcloud compute firewall-rules delete $rule --quiet
#done

#gcloud compute firewall-rules delete amcop-kud-access --quiet
