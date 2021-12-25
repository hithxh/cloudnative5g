#!/bin/bash

VM_CONFIG_JSON_FILE=${1}
VM_USER=${2}
ANOD_LITE_LOG_FOLDER=${3}

source ../config/config.sh

if [[ "$VM_USER" != *"VM_USER"* ]]
then
    ANSIBLE_SSH_USER=$VM_USER
fi

CLUSTER_NAME=$(jq -r '."deployment_configs"."emco_config"."cluster_ref_name"' $VM_CONFIG_JSON_FILE);

anod_dir=$(echo $ANOD_LITE_LOG_FOLDER | sed 's,/*[^/]\+/*$,,')

# uninstall k8s cluster
ansible-playbook -i $anod_dir/inventory/${CLUSTER_NAME}/hosts.yaml --user=$ANSIBLE_SSH_USER --become --become-user=root $anod_dir/kubespray/reset.yml -e reset_confirmation=yes 2>&1 >$ANOD_LITE_LOG_FOLDER/reset_cluster.log
