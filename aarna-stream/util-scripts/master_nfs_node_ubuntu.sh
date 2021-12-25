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

#Install NFS kernel
sudo apt install -y nfs-kernel-server
sudo apt install -y nfs-common

#Create /dockerdata-nfs and set permissions
sudo mkdir -p /dockerdata-nfs
sudo chmod 777 -R /dockerdata-nfs
sudo chown nfsnobody:nfsnobody /dockerdata-nfs/

#Update the /etc/exports
NFS_EXP=""
for i in $@; do
  NFS_EXP+="$i(rw,sync,no_root_squash,no_subtree_check,insecure) "
done
echo "/dockerdata-nfs "$NFS_EXP | sudo tee -a /etc/exports

#Restart the NFS service
sudo exportfs -a
sudo systemctl restart nfs-kernel-server
sleep 5

MASTER_IP=$1
while read PORT
do
  echo "Changing status of port:$PORT in iptables..."
  sudo iptables -I INPUT -p udp --dport $PORT -j ACCEPT
  sudo iptables -I INPUT -p tcp --dport $PORT -j ACCEPT
done < <(rpcinfo -p $MASTER_IP | grep -v program | grep -v status | awk '{print $4;}' | sort -u)

sudo service iptables save
