#!/bin/bash
#
# This script will loop through json configuration file and deploy onap components
# It will deploy onap on a cluster that the user has configured in the 
# configuration file.

VM_CONFIG_JSON_FILE=${1}
JUMP_HOST_IP=${2}
OOM_OVERRIDE_FILE=${3}
ANOD_LITE_LOG_FOLDER=${4}
SSH_PRIV_KEY_FILE=${5}
JUMP_HOST_USER=${6}
NFS_FOLDER=${7}
VM_USER=${8}
SERVER_NAME=${9}

EXT_SER_FLAG=0
anod_dir=$(echo $ANOD_LITE_LOG_FOLDER | sed 's,/*[^/]\+/*$,,')
kubespray_dir=$anod_dir/kubespray
echo $kubespray_dir and $anod_dir

source $anod_dir/config/config.sh

if [[ "$VM_USER" != *"VM_USER"* ]]
then
    ANSIBLE_SSH_USER=$VM_USER
fi

CLUSTER_NAME=$(jq -r '."deployment_configs"."onap_config"."cluster_ref_name"' $VM_CONFIG_JSON_FILE);

#Checking if Cluster creation is successful

echo "Cluster name is :$CLUSTER_NAME"

if [ ! -f $ANOD_LITE_LOG_FOLDER/cluster_setup.log ] ; then
   echo "Trying to deploy emco without cluster setup. Exiting"
   #exit 0
fi

IS_CLUSTER_CREATION_SUCCESSFUL=$(echo $(cat $ANOD_LITE_LOG_FOLDER/cluster_setup.log | grep "failed=1"))
echo "Cluster formation status : $IS_CLUSTER_CREATION_SUCCESSFUL"
if [ ! -z $IS_CLUSTER_CREATION_SUCCESSFUL ] ; then
   echo "Cluster creation is not successful. Exiting"
   exit 0
fi

       for j in $(jq '.servers | keys | .[]' $VM_CONFIG_JSON_FILE); do
          if [[ "$SERVER_NAME" != *"SERV_NAME"* ]]
          then
            echo "Deploy ONAP: Server name is external: $SERVER_NAME"
            EXT_SER_FLAG=1
            server_name=$SERVER_NAME
          else
            server_name=$(jq -r '.["servers"]'[$j]'["server_name"]' $VM_CONFIG_JSON_FILE);
          fi

          if [[ $server_name != *"<VM-NAME>"* ]]
          then
             echo "Server name is : $server_name"
             CLUST_NAME=$(jq -r '.["servers"]'[$j]'["cluster_ref_name"]' $VM_CONFIG_JSON_FILE);
             echo "cluster name is : $CLUST_NAME $CLUSTER_NAME"
             if [[ $CLUST_NAME == $CLUSTER_NAME ]]
             then
                echo "$server_name is part of cluster $CLUST_NAME"
                IP_ADDR=$(jq -r '.["servers"]'[$j]'["ip_address"]' $VM_CONFIG_JSON_FILE);
                if [[ $IP_ADDR != *"<IP-ADDRESS>"* ]]
	        then
		     echo "Static IP defined is : $IP_ADDR"
		else
		     #echo "sleeping for 3 minutes for the VM IP to be available"
		     #sleep 3m
		     IP_ADDR=$(echo $(sudo virsh domifaddr $server_name | grep -i 'ipv4' | awk '{print $4}' | awk -F'/' '{print $1}'))
		fi
                echo "IP address is : $IP_ADDR"
                IS_MASTER=$(jq -r '.["servers"]'[$j]'["is_master"]' $VM_CONFIG_JSON_FILE);
                if [ $IS_MASTER = true ] ; then
                  echo "master server"
                  MASTER_IP=$MASTER_IP$IP_ADDR" "
                  IP_ADDR=""
                else
                  echo "Not a master node"
                  IP_ADDR=$IP_ADDR" "
                fi
             fi
          fi
          if [ $EXT_SER_FLAG -eq 1 ]; then
            break
          fi
       done
       IP_ADDRESSES=$MASTER_IP$IP_ADDR
       echo "IP addresses are :$IP_ADDRESSES"
       BRANCH_NAME=$(jq -r '."deployment_configs"."onap_config"."branch_name"' $VM_CONFIG_JSON_FILE);
       #BRANCH_NAME=$(jq -r '."deployment-config"."branch-name"' $VM_CONFIG_JSON_FILE);
       echo "branch name is : $BRANCH_NAME"
       echo "Jump host ip: $JUMP_HOST_IP"
       echo "override file: $OOM_OVERRIDE_FILE"
       echo " SSH: $SSH_PRIV_KEY_FILE"
       echo "cluster name is :${CLUSTER_NAME}"
       echo "NFS folder is : $NFS_FOLDER"
       cat $anod_dir/inventory/${CLUSTER_NAME}/hosts.yaml
       if [ ! -z "$IP_ADDRESSES" ] ; then
           echo "Setting up NF Server"
           #/usr/local/bin/ansible-playbook --verbose $anod_dir/playbooks/setup_nfsserver.yaml -i $anod_dir/ansible/deployment/inventory.ini -e "jumphost_ip=$JUMP_HOST_IP jump_host_user=$JUMP_HOST_USER cluster_ip_all='$IP_ADDRESSES' anod_nfs_folder=$NFS_FOLDER"  --private-key=$SSH_PRIV_KEY_FILE --become --become-user=root > $ANOD_LITE_LOG_FOLDER/setup_nfs.log 2>&1

           echo "Deploying ONAP components"
           /usr/local/bin/ansible-playbook --verbose $anod_dir/ansible/deployment/playbooks/onap_main.yaml -i $anod_dir/inventory/${CLUSTER_NAME}/hosts.yaml -e " jumphost_ip=$JUMP_HOST_IP jump_host_user=$JUMP_HOST_USER cluster_ip_all='$IP_ADDRESSES' anod_nfs_folder=$NFS_FOLDER oom_override_file=$OOM_OVERRIDE_FILE oom_branch=$BRANCH_NAME ansible_ssh_user=$ANSIBLE_SSH_USER" --private-key=$SSH_PRIV_KEY_FILE --become --become-user=root --flush-cache > $ANOD_LITE_LOG_FOLDER/deploy_onap.log 2>&1

       else
          echo "IP addresses are not available for VMs. Exiting"
          exit 0
       fi
