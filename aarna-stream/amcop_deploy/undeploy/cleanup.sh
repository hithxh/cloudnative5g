#!/bin/bash

VM_CONFIG_JSON_FILE=${1}
ANOD_LITE_LOG_FOLDER=${2}
SERVER_NAME=${3}

server_name=""
EXT_SER_FLAG=0

function cleanup() {
    if [ ! -z $server_name ] ; then
      sudo virsh destroy $server_name
      sudo virsh undefine $server_name
      sudo rm -rf /var/lib/libvirt/images/$server_name
    fi
}

for k in $(jq '.servers | keys | .[]' $VM_CONFIG_JSON_FILE); do
    if [[ "$SERVER_NAME" != *"SERV_NAME"* ]]
    then
       echo "Server name is passed as a parameter: $SERVER_NAME"
       EXT_SER_FLAG=1
       server_name=$SERVER_NAME
       cleanup
    else
       server_name=$(jq -r '.["servers"]'[$k]'["server_name"]' $VM_CONFIG_JSON_FILE);
       if [[ $server_name != *"<VM-NAME>"* ]]
       then
           cleanup
       else
           echo "Server name is not defined. Skipping"
       fi
    fi
    if [ $EXT_SER_FLAG -eq 1 ]; then
        break
    fi

done

anod_dir=$(echo $ANOD_LITE_LOG_FOLDER | sed 's,/*[^/]\+/*$,,')
kubespray_dir=$anod_dir/kubespray
inventory_dir=$anod_dir/inventory

sudo rm -rf /tmp/config/
sudo touch /etc/exports
#sudo echo "" > /etc/exports
sudo rm -rf $inventory_dir
sudo rm -rf $kubespray_dir
sudo rm -rf /dockerdata-nfs
sudo rm /tmp/cluster.yml
sudo rm /tmp/node*
sudo rm -rf $ANOD_LITE_LOG_FOLDER/*.*
sudo rm -rf /tmp/kubespray_cache
sudo rm -rf /tmp/ansible_command_payload*
sudo rm -rf /tmp/ansible_setup_payload*
