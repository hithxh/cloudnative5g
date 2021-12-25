#!/bin/bash
#
# A script to create a baremetal  VM
#

CONFIG_FOLDER_PATH=/tmp/config
META_DATA_FILE_PATH=meta-data
USER_DATA_FILE_PATH=user-data

choice=${1}
vm_name=${2}
disk_size=${3}
vCPU=${4}
mem=${5}
os_variant=${6}
ssh_pub_key=${7}
VM_USER=${8}
user_name=""

echo "passed values are :$vm_name $disk_size $vCPU $mem $os_varient $ssh_pub_key"

interactive=0

if [ $# -lt 5 ]
then
	echo;echo
	echo "$0 <OS_choice> <VM_name> <disk_size> <vcpus> <memory>"
	echo "Insufficient arguments...entering interactive mode"
	echo;echo
	interactive=1
fi

mkdir -p $CONFIG_FOLDER_PATH

if [ $interactive -eq 1 ]
then
read -p "Select the distro ( enter number)
	1. ubuntu 1604
	2. ubuntu 1804
        3. ubuntu 2004
	4. centos 7
	5. other
	: " choice 
fi

case $choice in
	"1") echo "ubuntu 1604"
	     image="xenial-server-cloudimg-amd64-disk1.img"
	     os_variant="ubuntu16.04"
	     URL="https://cloud-images.ubuntu.com/xenial/current/xenial-server-cloudimg-amd64-disk1.img"
	     dist=ubuntu
	;;
	"2") echo "ubuntu 1804"
	     image="bionic-server-cloudimg-amd64.img" 
             os_variant="ubuntu18.04"
	     URL="https://cloud-images.ubuntu.com/bionic/current/bionic-server-cloudimg-amd64.img"
	     dist=ubuntu
	;;
        "3") echo "ubuntu 2004"
             image="focal-server-cloudimg-amd64.img"
             os_variant="ubuntu20.04"
             URL="https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img"
             dist=ubuntu
        ;;
	"4") echo "centos 7"
	     image="CentOS-7-x86_64-GenericCloud.qcow2"
	     os_variant="centos7.0"
	     URL="https://cloud.centos.org/centos/7/images/CentOS-7-x86_64-GenericCloud.qcow2"
	     dist=centos
	;;
	"5") echo "other"
	      read -p "Enter the distro: " dist
	      read -p "Enter the url for WGET: " URL
	      read -p "Enter image name: " image
	      read -p "Enter OS varian: " os_variant 
	;;
	esac
if [ $os_variant == "ubuntu18.04" ];  then
        echo "Going to create ubuntu 1804"
        image="bionic-server-cloudimg-amd64.img"
        URL="https://cloud-images.ubuntu.com/bionic/current/bionic-server-cloudimg-amd64.img"
        dist="ubuntu"
elif [ $os_variant == "ubuntu16.04" ];  then
        echo "Going to create ubuntu 1604"
        image="xenial-server-cloudimg-amd64-disk1.img"
        URL="https://cloud-images.ubuntu.com/xenial/current/xenial-server-cloudimg-amd64-disk1.img"
        dist="ubuntu"
elif [ $os_variant == "ubuntu20.04" ];  then
        echo "Going to create ubuntu 2004"
        image="focal-server-cloudimg-amd64.img"
        URL="https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img"
        dist="ubuntu"
elif [ $os_variant == "centos7.0" ];  then
        echo "Going to create centos 7.0"
        image="CentOS-7-x86_64-GenericCloud.qcow2"
        URL="https://cloud.centos.org/centos/7/images/CentOS-7-x86_64-GenericCloud.qcow2"
        dist="centos" 
fi

hostnamectl |  grep "Operating System: CentOS"
if [ $? -eq 0 ]; then
	OS_REL="CENTOS"
fi

hostnamectl | grep "Operating System: Ubuntu"
if [ $? -eq 0 ]; then
	OS_REL="UBUNTU"
fi

echo "Install required system packages"
if [ ${OS_REL} == CENTOS ] ; then
sudo yum install qemu-kvm libvirt-bin qemu-utils genisoimage virtinst -y
else
sudo apt-get install qemu-kvm libvirt-bin virtinst bridge-utils cpu-checker genisoimage -y
fi

echo "Download $dist cloud image"
echo "Image URL is : $URL and Image is $image"
DISK_FILE=/var/lib/libvirt/images/base/$image
if [ ! -f "$DISK_FILE" ]; then
	   wget $URL 

	   echo "Create directory for base images"
	   sudo mkdir -p /var/lib/libvirt/images/base

	   echo "Move downloaded image into this folder"
	   sudo mv $image /var/lib/libvirt/images/base/
   fi

   if [ $interactive -eq 1 ] 
   then
   	read -p "Enter the VM name you wish to create: " vm_name
   fi

   echo  "Create directory for our instance images"
   sudo mkdir /var/lib/libvirt/images/$vm_name

   echo  "Create a disk image based on the Ubuntu image"
   sudo qemu-img create -f qcow2 -o backing_file=/var/lib/libvirt/images/base/$image /var/lib/libvirt/images/$vm_name/"$vm_name".qcow2

   if [ $interactive -eq 1 ] 
   then
   read -p "Enter the size of the disk in GB: " disk_size
   fi

   echo "Setting size to $disk_size GB"
   sudo qemu-img resize /var/lib/libvirt/images/$vm_name/$vm_name.qcow2 "$disk_size"G

   echo "Now we are going to create configs to make Cloud-Init do following > create new user > configure SSH access by a public key >Create meta-data"

#create user-data and meta-data files under temp directory
VM_CONFIG_DIR=$CONFIG_FOLDER_PATH/$vm_name
mkdir -p $VM_CONFIG_DIR
touch $VM_CONFIG_DIR/$USER_DATA_FILE_PATH
touch $VM_CONFIG_DIR/$META_DATA_FILE_PATH

cat >$VM_CONFIG_DIR/$META_DATA_FILE_PATH <<EOF
local-hostname: $vm_name
EOF

if [ $interactive -eq 1 ]
   then
     echo "Read public key into environment variable"
     export PUB_KEY=$(cat ~/.ssh/id_rsa.pub)
else
     echo "Read public key into environment variable"
     export PUB_KEY=$(cat $ssh_pub_key)
fi

if [ $interactive -eq 1 ]
then
   user_name=$dist
else
   if [[ "$VM_USER" != *"VM_USER"* ]]
   then
     user_name=$VM_USER
   else
     user_name=$dist
   fi
fi

echo "Create user-data"
cat >$VM_CONFIG_DIR/$USER_DATA_FILE_PATH <<EOF
#cloud-config
users:
- name: $user_name
  ssh-authorized-keys:
    - $PUB_KEY
  sudo: ['ALL=(ALL) NOPASSWD:ALL']
  groups: sudo
  shell: /bin/bash
runcmd:
- echo "AllowUsers $user_name" >> /etc/ssh/sshd_config
- restart ssh
EOF

echo "Create a disk to attach with Cloud-Init configuration"
sudo genisoimage  -output /var/lib/libvirt/images/$vm_name/$vm_name-cidata.iso -volid cidata -joliet -rock $VM_CONFIG_DIR/$USER_DATA_FILE_PATH $VM_CONFIG_DIR/$META_DATA_FILE_PATH

if [ $interactive -eq 1 ] 
then
read -p "Enter number of vCPUS: " vCPU
read -p "Ender memory in GB: " mem
fi

echo "Start the virtual machine with two disks attached: '$vm_name'.qcow2 as root disk and '$vm_name'-cidata.iso as disk with Cloud-Init configuration"


if [ $OS_REL = "UBUNTU" ] ; then
   version_id=$(echo $(cat /etc/os-release | grep 'VERSION_ID' | awk -F"=" '{print $2}' |  tr -d '"'))
   os_variant="ubuntu$version_id"
fi

echo "virst install parameters: $vm_name, $mem, $vCPU, $os_variant"

sudo virt-install --connect qemu:///system --name $vm_name --ram $(($mem << 10)) --vcpus=$vCPU --os-type linux --os-variant $os_variant --disk path=/var/lib/libvirt/images/$vm_name/"$vm_name".qcow2,format=qcow2 --disk /var/lib/libvirt/images/$vm_name/$vm_name-cidata.iso,device=cdrom --import --network network=default --noautoconsole --cpu host
