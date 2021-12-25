#!/bin/bash
#
# Script to set up a Baremetal Ubuntu 16.04 or later versions
#set -e

echo "-- Going to install virtualization tools"
sudo apt-get update -y
sudo apt-get install git python3 -y
sudo apt-get install qemu qemu-kvm virt-manager bridge-utils virtinst libguestfs-tools virt-top -y
sudo usermod -aG libvirt $USER
sudo usermod -aG kvm $USER
sudo apt-get install cpu-checker -y

echo "-- Going to setup libvirt default network and storge pool"
virsh pool-define-as --name default --type dir --target /var/lib/libvirt/images/
virsh pool-autostart default
virsh pool-start default
virsh pool-list --all
virsh net-autostart default
virsh net-list
virsh net-list --all


echo "-- Going to install python3 pip"
sudo apt-get install python3-pip -y
pip3 install --upgrade pip

echo "-- Going to installansible"
# This is mainly needed for Ubuntu 16
sudo apt-get install libffi6 libffi-dev -y
INSTALLER_DIR="$(readlink -f "$(dirname "${BASH_SOURCE[0]}")")"
echo $INSTALLER_DIR
sudo -H pip3 install -r $INSTALLER_DIR/requirements.txt
echo "-- Installing jq,zip and unzip"
sudo apt-get install zip jq unzip -y

echo "-- Going to install gcloud CLI"
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get install apt-transport-https ca-certificates gnupg -y
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt-get update -y && sudo apt-get install google-cloud-sdk -y

#Install and setup docker container
#sudo curl -sSL https://get.docker.com/ | sh
#sudo chkconfig docker on
#sudo systemctl enable docker
#sudo systemctl start docker
#sudo systemctl status docker
         
# Include the sudo user into the docker group
#sudo usermod -aG docker $USER

#Install azure cli and other stuff
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

sudo apt-get update -y && sudo apt-get install -y apt-transport-https gnupg2
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update -y
sudo apt-get install -y kubectl

# Install Amazon CLI
if [[ $(which aws) ]]; then
    echo "asw cli already exists"
    which aws
    aws --version
    #update the current aws installation to v2, if not v2
    sudo ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
else
    echo "no files found"
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    yes n | unzip awscliv2.zip
    sudo ./aws/install
fi
#Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

exit 0

