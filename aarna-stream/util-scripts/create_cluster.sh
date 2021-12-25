#!/bin/bash
#
# This script will form a cluster

VM_CONFIG_JSON_FILE=${1}
JUMP_HOST_IP=${2}
ANOD_LITE_LOG_FOLDER=${3}
SSH_PRIV_KEY_FILE=${4}
VM_USER=${5}
SERVER_NAME=${6}

EXT_SER_FLAG=0

# Get the cluster and related ips
for i in $(jq '.clusters | keys | .[]' $VM_CONFIG_JSON_FILE); do
     IP_ADDR=""
     MASTER_IP=""
     CLUSTER_NAME=$(jq -r '.["clusters"]'[$i]'["cluster_name"]' $VM_CONFIG_JSON_FILE);
     if [[ $CLUSTER_NAME != *"<CLUSTER-NAME>"* ]]
     then
       echo "Cluster name: $CLUSTER_NAME"
       for j in $(jq '.servers | keys | .[]' $VM_CONFIG_JSON_FILE); do
           if [[ "$SERVER_NAME" != *"SERV_NAME"* ]]
           then
               echo "Cluster: Server name is external: $SERVER_NAME"
               EXT_SER_FLAG=1
               server_name=$SERVER_NAME
           else
               server_name=$(jq -r '.["servers"]'[$j]'["server_name"]' $VM_CONFIG_JSON_FILE);
          fi

          if [[ $server_name != *"<VM-NAME>"* ]]
          then
             echo "Server name is : $server_name"
             CLUST_NAME=$(jq -r '.["servers"]'[$j]'["cluster_ref_name"]' $VM_CONFIG_JSON_FILE);
             if [[ $CLUST_NAME == $CLUSTER_NAME ]]
             then
                echo "$server_name is part of cluster $CLUST_NAME"
                IP_ADDR=$(jq -r '.["servers"]'[$j]'["ip_address"]' $VM_CONFIG_JSON_FILE);
                if [[ $IP_ADDR != *"<IP-ADDRESS>"* ]]
                then
                      echo "Static IP defined is : $IP_ADDR"
                else
                        echo "sleeping for 3 minutes for the VM IP to be available"
                        sleep 3m
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
       echo "Jump host ip: $JUMP_HOST_IP"
       echo "SSH private key file: $SSH_PRIV_KEY_FILE"
       if [ ! -z "$IP_ADDRESSES" ] ; then       
       sudo /bin/bash -x ../amcop_deploy/scripts/alite_install.sh $CLUSTER_NAME $JUMP_HOST_IP "$IP_ADDRESSES" $SSH_PRIV_KEY_FILE $ANOD_LITE_LOG_FOLDER $VM_USER
       else
          echo "IP addresses are not available for VMs. Exiting"
          exit 0
       fi
     fi
     if [ $EXT_SER_FLAG -eq 1 ]; then
       break
     fi
done
