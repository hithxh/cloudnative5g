#!/bin/sh

if [ "$#" -lt 1 ]; then
  echo "Usage: ./$(basename $0) <VM Name 1> <VM Name 2> ... <VM Name N>"
  exit 1
fi

for i in $@; do
    sudo virsh destroy $i
    sudo virsh undefine $i
    sudo rm -rf /var/lib/libvirt/images/$i
done

sudo rm -rf /tmp/config/
#sudo rm -rf /etc/exports
#sudo touch /etc/exports
#sudo echo "" > /etc/exports
sudo rm -rf ../inventory/
sudo rm -rf ../kubespray/
#sudo rm -rf /dockerdata-nfs
sudo rm /tmp/cluster.yml
sudo rm /tmp/node*
sudo rm -rf logs/*.*
sudo rm -rf /tmp/kubespray_cache
sudo rm -rf /tmp/ansible_command_payload*
sudo rm -rf /tmp/ansible_setup_payload*
