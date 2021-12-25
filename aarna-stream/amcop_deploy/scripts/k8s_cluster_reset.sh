#!/bin/bash

cluster=${1}

if [ $# -lt 1 ]
then
        echo "$0 <cluster_name>"
        exit
fi

source ../config/config.sh

# uninstall k8s cluster
ansible-playbook -i ../inventory/$cluster/hosts.yaml --user=$ANSIBLE_SSH_USER --become --become-user=root ../kubespray/reset.yml -e reset_confirmation=yes
