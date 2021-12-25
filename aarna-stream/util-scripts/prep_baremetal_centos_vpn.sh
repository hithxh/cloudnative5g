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

# setup openvpn client
sudo yum install -y openvpn

INSTALLER_DIR="$(readlink -f "$(dirname "${BASH_SOURCE[0]}")")"

# use initSetup profile to get vpn profile allocated for this server
sudo openvpn --config $INSTALLER_DIR/../lab-vpn/ovpn/initSetup.conf > /dev/null &

sudo openvpn --config lab-vpn/ovpn/initSetup.ovpn > /dev/null &
printf "%s" "waiting for profile allocation - "
while ! ping -c 1 -n -w 1 10.111.0.1 &> /dev/null
do
    printf "%c" "."
done
PROFILE=$(curl --fail http://10.111.0.1/allocate)
if [ -z "$PROFILE" ]
then
    printf "failed to get profile allocation done... contact prabhjot@aarnanetworks.com\n"
else
    printf "Got Profile %s\n" $PROFILE
fi

sudo killall openvpn
sudo scp lab-vpn/ovpn/$PROFILE.conf /etc/openvpn/
sudo service openvpn@$PROFILE start

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

#sudo virsh net-define /etc/libvirt/qemu/networks/autostart/default.xml
count=$(sudo virsh list --all | wc -l)
if [ $count -gt 3 ]
then
    printf "failed to create network"
    exit 1
fi
# only if we don't have any prior vm created
sudo virsh net-destroy default
sudo virsh net-undefine default
sudo virsh net-define $INSTALLER_DIR/../lab-vpn/network-config/$PROFILE.xml
sudo virsh net-autostart default
sudo virsh net-start default
sudo virsh net-list

# enable iptables to allow traffic from openvpn
sudo iptables -I FORWARD 1 -i tun0 -j ACCEPT

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
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
#Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

