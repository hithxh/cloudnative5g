#!/bin/bash

cluster=${1}

if [ $# -lt 1 ]
then
	echo "$0 <cluster_name>"
	exit
fi

source ../config/config.sh

#uninstall ONAP deployment
nohup ansible-playbook --verbose ../ansible/deployment/playbooks/uninstall/uninstall_anod.yaml -i inventory/${cluster}/hosts.yaml  -e "cluster=$cluster ansible_ssh_user=$ANSIBLE_SSH_USER kube_version=$KUBE_VERSION docker_version=$DOCKER_VERSION" --flush-cache &
