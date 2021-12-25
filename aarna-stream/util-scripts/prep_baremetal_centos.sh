#!/bin/bash
#
# Script to set up a Baremetal CentOS 7.x server for OPNFV deployment
# It installs all the required packages and prepared for the deployment
# NOTE: 
# The server needs to have Nested VM feature enabled
#
sudo systemctl mask firewalld
sudo systemctl stop firewalld
sudo systemctl status firewalld
sudo yum install iptables-services -y
sudo chkconfig iptables on
sudo systemctl enable iptables
sudo systemctl start iptables
sudo systemctl status iptables

sudo yum -y update
sudo yum install wget -y

sudo yum -y groupinstall "Virtualization Host"
sudo yum -y install virt-install
sudo yum install epel-release -y
sudo yum install python3-pip -y
sudo pip3 install --upgrade pip

INSTALLER_DIR="$(readlink -f "$(dirname "${BASH_SOURCE[0]}")")"
sudo pip3 install -r $INSTALLER_DIR/requirements.txt
sudo yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
sudo yum install jq -y
sudo yum install -y libselinux-python3

sudo chkconfig libvirtd on
sudo systemctl enable libvirtd
sudo systemctl start libvirtd
sudo systemctl status libvirtd       
sudo chkconfig openvswitch on
sudo systemctl enable openvswitch
sudo systemctl start openvswitch
sudo systemctl status openvswitch

sudo usermod -aG libvirt $USER


sudo virsh net-define /etc/libvirt/qemu/networks/autostart/default.xml
sudo virsh net-autostart default
sudo virsh net-list

# Enable default storage pool

# Check if we have the default storage pool
sudo virsh pool-list
  
# If there is no default storage pool then define one
sudo virsh pool-define-as --name default --type dir --target /var/lib/libvirt/images/
sudo virsh pool-autostart default
sudo virsh pool-start default

# Check, if we have the default storage pool created successfully
sudo virsh pool-list

#Install and setup docker container

#sudo curl -sSL https://get.docker.com/ | sh
#sudo chkconfig docker on
#sudo systemctl enable docker
#sudo systemctl start docker
#sudo systemctl status docker
         
# Include the sudo user into the docker group
#sudo usermod -aG docker $USER

# Make sure that we have required libguestfs tools on the base OS (assumed to be CentOS)

sudo yum install -y libguestfs-tools

# Update YUM with Cloud SDK repo information:

sudo tee -a /etc/yum.repos.d/google-cloud-sdk.repo << EOM
[google-cloud-sdk]
name=Google Cloud SDK
baseurl=https://packages.cloud.google.com/yum/repos/cloud-sdk-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg
       https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOM

# Install the Cloud SDK
sudo yum -y install google-cloud-sdk

sudo virsh net-autostart default
sudo virsh net-list

#Install the kube commands
sudo tee -a  /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF

sudo yum install -y kubelet kubeadm kubectl

# Install AKS command line
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc

sudo sh -c 'echo -e "[azure-cli]
name=Azure CLI
baseurl=https://packages.microsoft.com/yumrepos/azure-cli
enabled=1
gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/azure-cli.repo'

sudo yum install azure-cli -y

# Install Amazon CLI
#curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
#unzip awscliv2.zip
#sudo ./aws/install
if [[ $(which aws) ]]; then
    echo "asw cli already exists"
    which aws
    aws --version
    aws_ver=$(echo $(aws --version | awk -F" " '{print $1}' | awk -F"/" '{print $2}' | awk -F"." '{print $1}'))
    if [ $aws_ver -ne 2 ]; then
        #update the current aws installation to v2, if not v2
        echo "awscli is not v2, updating to v2"
        sudo ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
    fi
else
    echo "no files found"
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    yes n | unzip awscliv2.zip
    sudo ./aws/install
fi

#Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

