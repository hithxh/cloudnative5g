#!/bin/bash

VM_CONFIG_JSON_FILE=${1}
ANOD_LITE_LOG_FOLDER=${2}
SSH_PRIV_KEY_FILE=${3}
VM_USER=${4}

echo "VM_CONFIG_JSON_FILE $VM_CONFIG_JSON_FILE"

anod_dir=$(echo $ANOD_LITE_LOG_FOLDER | sed 's,/*[^/]\+/*$,,')

CLUSTER_NAME=$(jq -r '."deployment_configs"."emco_config"."cluster_ref_name"' $VM_CONFIG_JSON_FILE);

echo "cluster name is $CLUSTER_NAME"

source ../config/config.sh

if [[ "$VM_USER" != *"VM_USER"* ]]
then
    ANSIBLE_SSH_USER=$VM_USER
fi

# uninstall ONAP components

ANSIBLE_HOST_KEY_CHECKING=false ansible-playbook --verbose $anod_dir/ansible/deployment/playbooks/uninstall/uninstall_anod.yaml -i $anod_dir/inventory/${CLUSTER_NAME}/hosts.yaml -e ansible_ssh_user=$ANSIBLE_SSH_USER --private-key=$SSH_PRIV_KEY_FILE --flush-cache 2>&1 >$ANOD_LITE_LOG_FOLDER/onap_uninstall.log
