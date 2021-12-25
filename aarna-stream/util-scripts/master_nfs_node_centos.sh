#!/bin/bash

usage () {
  echo "Usage:"
  echo "   ./$(basename $0) node1_ip node2_ip ... nodeN_ip"
  exit 1
}

if [ "$#" -lt 1 ]; then
  echo "Missing NFS slave nodes"
  usage
fi

nfs_server_folder=$1

#Install NFS kernel
sudo yum install nfs-utils -y

#Create /dockerdata-nfs and set permissions
sudo mkdir -p $nfs_server_folder
sudo chmod 777 -R $nfs_server_folder
sudo chown nfsnobody:nfsnobody $nfs_server_folder/


#Update the /etc/exports
NFS_EXP=""
for i in ${@:2}; do
  NFS_EXP+="$i(rw,sync,no_root_squash,no_subtree_check,insecure) "
done
echo $nfs_server_folder" "$NFS_EXP | sudo tee -a /etc/exports

#Restart the NFS service
sudo exportfs -a
sudo systemctl restart nfs-server
sleep 5

MASTER_IP=$2
while read PORT
do
  echo "Changing status of port:$PORT in iptables..."
  sudo iptables -I INPUT -p udp --dport $PORT -j ACCEPT
  sudo iptables -I INPUT -p tcp --dport $PORT -j ACCEPT
done < <(rpcinfo -p $MASTER_IP | grep -v program | grep -v status | awk '{print $4;}' | sort -u)

sudo service iptables save
