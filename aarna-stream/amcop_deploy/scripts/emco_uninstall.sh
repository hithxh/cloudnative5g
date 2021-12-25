#!/bin/bash

cluster=${1}
private_key_path=${2}

if [ $# -lt 2 ]
then
        echo "$0 <cluster_name> <private_key_file_path_to_access_VM>"
        echo "Exiting..."
        exit 0
fi

source ../config/config.sh

# uninstall ONAP components
ansible-playbook --verbose ../ansible/deployment/playbooks/uninstall/uninstall_emco.yaml -i ../inventory/${cluster}/hosts.yaml  -e ansible_ssh_user=$ANSIBLE_SSH_USER --private-key=$private_key_path --flush-cache 
