#!/bin/bash

# This script will create a KUD cluster on a Azure VM
# This cluster can then be used for orchestration 

# Accept the terms for the image NOTE: This may not be needed multiple times
az vm image terms accept --urn Canonical:0001-com-ubuntu-pro-bionic:pro-18_04-lts:18.04.20200729

az vm create  --resource-group amcop-cluster-group --name amcop-kud  --size Standard_D16s_v3  --image Canonical:0001-com-ubuntu-pro-bionic:pro-18_04-lts:18.04.20200729  --ssh-key-values ~/.ssh/id_rsa.pub --admin-username aarna --vnet-name amcop-aks-vnet --subnet amcop-subnet

# Get the IP address of the VM
IPADDR=`az vm list --show-details -o=table  | grep amcop-kud | awk '{ print $5 }'`

# Setup the machine
ssh -o CheckHostIP=no -o StrictHostKeyChecking=no aarna@${IPADDR} "sudo apt-get update -y ; sudo apt-get upgrade -y ; sudo apt-get install -y python-pip"

ssh -o CheckHostIP=no -o StrictHostKeyChecking=no aarna@${IPADDR} "git clone https://git.onap.org/multicloud/k8s/"

ssh -o CheckHostIP=no -o StrictHostKeyChecking=no aarna@${IPADDR} "cd  k8s/kud/hosting_providers/baremetal/ ; nohup ./aio.sh &> /tmp/nohup.out < /dev/null &"

echo "Setup, initiated, please wait for 15 min for the install to complete."
echo "To check logs, use below command:"
echo "          ssh aarna@${IPADDR} \"tail -f  /tmp/nohup.out \" "

