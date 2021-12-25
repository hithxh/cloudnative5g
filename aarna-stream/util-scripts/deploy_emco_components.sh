#!/bin/bash
#
# This script will call emco main to install istio and other components

VM_CONFIG_JSON_FILE=${1}
JUMP_HOST_IP=${2}
ANOD_LITE_LOG_FOLDER=${3}
SSH_PRIV_KEY_FILE=${4}
JUMP_HOST_USER=${5}
VM_USER=${6}

anod_dir=$(echo $ANOD_LITE_LOG_FOLDER | sed 's,/*[^/]\+/*$,,')

source $anod_dir/config/config.sh

if [[ "$VM_USER" != *"VM_USER"* ]]
then
    ANSIBLE_SSH_USER=$VM_USER
fi

CLUSTER_NAME=$(jq -r '."deployment_configs"."emco_config"."cluster_ref_name"' $VM_CONFIG_JSON_FILE);
echo "Cluster name is :$CLUSTER_NAME"

if [ ! -f $ANOD_LITE_LOG_FOLDER/cluster_setup.log ] ; then
   echo "Trying to deploy emco without cluster setup. Exiting"
   exit 0
fi

IS_CLUSTER_CREATION_SUCCESSFUL=$(echo $(cat $ANOD_LITE_LOG_FOLDER/cluster_setup.log | grep "failed=1"))
echo "Cluster formation status : $IS_CLUSTER_CREATION_SUCCESSFUL"
if [ ! -z $IS_CLUSTER_CREATION_SUCCESSFUL ] ; then
   echo "Cluster creation is not successful. Exiting"
   exit 0
fi

/usr/local/bin/ansible-playbook --verbose $anod_dir/ansible/deployment/playbooks/emco_main.yaml -i $anod_dir/inventory/${CLUSTER_NAME}/hosts.yaml -e " jumphost_ip=$JUMP_HOST_IP jump_host_user=$JUMP_HOST_USER ansible_ssh_user=$ANSIBLE_SSH_USER" --private-key=$SSH_PRIV_KEY_FILE  --flush-cache > $ANOD_LITE_LOG_FOLDER/deploy_emco_components.log 2>&1
