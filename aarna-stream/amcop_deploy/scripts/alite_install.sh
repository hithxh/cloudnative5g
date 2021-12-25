#!/bin/sh

# Script to create KuD cluster and deploy ONAP (ANOD lite)

cluster=${1}
jumphost_ip=${2}
input_vm_ips=${3}
ssh_priv_key_file=${4}
ANOD_LITE_LOG_FOLDER=${5}
VM_USER=${6}

interactive=0

if [ $# -lt 5 ]
then
	echo;echo
	echo "$0 <cluster_name> <jumphost_ip> <node ips> <ssh private key> <log folder>"
	echo "Insufficient arguments...entering interactive mode"
	echo;echo
	interactive=1
fi

if [ $interactive -eq 1 ]
then
read -p "Enter cluster name: " cluster
read -p "Enter host ip: " jumphost_ip
read -p "Enter cluster node ip's seperated by space starting with master ip: " input_vm_ips
read -p "Provide oom branch to be cloned, hit enter for master: " oom_branch
read -p "provide absolute path for override file, hit enter for oom default: " oom_override_file
read -p "Enter helm version (2 or 3): " helm_version
fi

INSTALLER_DIR="$(readlink -f "$(dirname "${BASH_SOURCE[0]}")")"
source $INSTALLER_DIR/../config/config.sh
kubespray_dir=$INSTALLER_DIR/../kubespray

if [ $interactive -eq 0 ]
then
  if [[ "$VM_USER" != *"VM_USER"* ]]
  then
     ANSIBLE_SSH_USER=$VM_USER
  fi
fi

echo "Cluster name is : $cluster"
echo "user name is: $ANSIBLE_SSH_USER"

#create inventory folder for cluster
mkdir -p $INSTALLER_DIR/../inventory/${cluster}

#clone kubespray code base if not exists. release > 2.10 does not support k8s < v1.17
if [ ! -d "$kubespray_dir" ]; then
 git clone --single-branch --branch $KUBESPRAY_RELEASE_TAG  https://github.com/kubernetes-incubator/kubespray.git $kubespray_dir
fi

#cp -rfp $kubespray_dir/inventory/sample ./inventory/${cluster}
cp -rfp $kubespray_dir/inventory/sample $INSTALLER_DIR/../inventory/${cluster}
#Commenting it out as ansible.cfg file gets copied into util folder
#cp -rfp $kubespray_dir/ansible.cfg .

#copy ubuntu-amd64.yml changes, this is required because there is mismatch between docker-ce and docker api version
cp -r $INSTALLER_DIR/../resources/ubuntu-amd64.yml $kubespray_dir/roles/container-engine/docker/vars/ubuntu-amd64.yml

#create hosts file from ip addresses
declare -a IPS=($input_vm_ips)
CONFIG_FILE=$INSTALLER_DIR/../inventory/${cluster}/hosts.yaml $PYTHON_VERSION $kubespray_dir/contrib/inventory_builder/inventory.py ${IPS[@]}

if [ $interactive -eq 1 ]
then
   /usr/local/bin/ansible-playbook --verbose $INSTALLER_DIR/../ansible/deployment/playbooks/main.yaml -i $INSTALLER_DIR/../inventory/${cluster}/hosts.yaml  -e "cluster_ip_all='$input_vm_ips' helmversion=$helm_version kubespray_dir=$kubespray_dir oom_override_file=$oom_override_file oom_branch=$oom_branch ansible_ssh_user=$ANSIBLE_SSH_USER kube_version=$KUBE_VERSION docker_version=$DOCKER_VERSION" --become --become-user=root --flush-cache
else
   #run ansible to create cluster 
   /usr/local/bin/ansible-playbook --verbose $kubespray_dir/cluster.yml -i $INSTALLER_DIR/../inventory/${cluster}/hosts.yaml  -e "cluster=$cluster jumphost_ip=$jumphost_ip kubespray_dir=$kubespray_dir cluster_ip_all='$input_vm_ips' ansible_ssh_user=$ANSIBLE_SSH_USER kube_version=$KUBE_VERSION docker_version=$DOCKER_VERSION" --private-key=$ssh_priv_key_file  --become --become-user=root --flush-cache > $ANOD_LITE_LOG_FOLDER/cluster_setup.log 2>&1
fi
