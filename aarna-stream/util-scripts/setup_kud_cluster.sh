#!/bin/sh
#
# This script will form a KUD cluster

ANOD_LITE_LOG_FOLDER=${1}
SERVER_NAME=${2}
SSH_PRIV_KEY_FILE=${3}

anod_dir=$(echo $ANOD_LITE_LOG_FOLDER | sed 's,/*[^/]\+/*$,,')

echo "sleeping for 3 minutes for the vm $SERVER_NAME to come up"
sleep 3m
IP_ADDR=$(echo $(sudo virsh domifaddr $SERVER_NAME | grep -i 'ipv4' | awk '{print $4}' | awk -F'/' '{print $1}'))

if [ ! -z "$IP_ADDR" ] ; then
       sudo rm -f $anod_dir/ansible/deployment/kud_inventory.ini
       echo "[Kud_host]"  >> $anod_dir/ansible/deployment/kud_inventory.ini
       echo "${IP_ADDR} ansible_user=ubuntu" >>  $anod_dir/ansible/deployment/kud_inventory.ini
           echo "Calling Ansible to setup up KUD cluster"
           /usr/local/bin/ansible-playbook --verbose $anod_dir/ansible/deployment/playbooks/setup_kud_cluster.yaml -i $anod_dir/ansible/deployment/kud_inventory.ini --private-key=$SSH_PRIV_KEY_FILE > $ANOD_LITE_LOG_FOLDER/setup_kud_cluster.log 2>&1
else
       echo "IP address is not available for VM. Exiting"
       exit 0
fi
