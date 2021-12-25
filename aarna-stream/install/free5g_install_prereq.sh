#!/bin/bash

NET_INTERFACE_NAME=$1

CRD_FILE_PATH=$HOME/aarna-stream/cnf/cnfs-helm/networkcrddef.yaml

if [ "$#" -ne 1 ]; then
   echo "Usage: <network interface name> "
   echo "Example: ./install_prereq.sh ens3 "   
   exit 1
fi

VM_IP=$(/sbin/ip -o -4 addr list $NET_INTERFACE_NAME | awk '{print $4}' | cut -d/ -f1)
GATEWAY_IP=$(/sbin/ip route | grep '^default' | awk '/'${NET_INTERFACE_NAME}'/ {print $3}')
echo "IP and gateway : $GATEWAY_IP and $VM_IP"

function install_docker() {
    sudo apt-get -y update
    sudo apt-get -y install docker.io apt-transport-https
    sudo systemctl enable docker.service    
}
function install_k8s() {
   sudo su - -c  "curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -"
   sudo su - -c "echo deb http://apt.kubernetes.io/ kubernetes-xenial main | tee /etc/apt/sources.list.d/kubernetes.list"
   sudo su - -c "apt-get update"
   sudo kubeadm reset -f
   sudo  apt install -y kubelet=1.20.0-00 kubeadm=1.20.0-00 kubectl=1.20.0-00
   sudo kubeadm init
   sudo rm -rf $HOME/.kube
   mkdir -p $HOME/.kube
   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
   sudo chown $(id -u):$(id -g) $HOME/.kube/config
   sleep 1m
}

function install_weave() {
   kubectl delete -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
   sleep 30s
   kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"	
   sleep 30s
}

function configure_weave() {
    sudo ip route add default via $GATEWAY_IP dev ens3 proto dhcp src $VM_IP metric 100
    sudo ip route add 10.32.0.0/12 dev weave proto kernel scope link src 10.32.0.1
    sudo ip route add 172.16.10.0/24 dev weave scope link
    sudo ip route add 172.16.30.0/24 dev weave scope link
    sudo ip route add 172.16.31.0/24 dev weave scope link
    sudo ip route add 192.168.1.0/24 dev weave scope link
    sudo ip route add 172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1
    sudo ip route add 192.168.10.0/24 dev weave scope link
    sudo ip route add 192.168.122.0/24 dev ens3 proto kernel scope link src $VM_IP
    sudo ip route add $GATEWAY_IP dev ens3 proto dhcp scope link src $VM_IP metric 100 
}

function install_multus() {
    cd $HOME	
    git clone https://github.com/intel/multus-cni.git
    cd multus-cni
    cat ./images/multus-daemonset.yml | kubectl delete -f -
    sleep 1m
    cat ./images/multus-daemonset.yml | kubectl apply -f -
}

function install_helm() {
    sudo rm -rf /usr/local/bin/helm
    ps -ef | grep -v grep | grep -iw helm | awk '{print $2}' | xargs kill -9    
    curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
    chmod 700 get_helm.sh
    sudo ./get_helm.sh -v v2.17.0

    kubectl -n kube-system create serviceaccount tiller
    kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
    helm init --service-account tiller
    kubectl taint nodes $(hostname) node-role.kubernetes.io/master-
    kubectl -n kube-system  rollout status deploy/tiller-deploy

    helm init --upgrade
    # Remove existing helm repositories

    helm repo remove local
    helm repo remove stable
    helm init --upgrade
    sleep 10
    # Start helm local repository in background
    nohup helm serve > helm_serve.log &
    sleep 10
    helm repo add local http://127.0.0.1:8879
    helm repo list
    kubectl taint nodes $(hostname) node-role.kubernetes.io/master- 
}
function install_go() {
   cd $HOME
   sudo rm go1.14.4.linux-amd64.tar.gz
   sudo rm -rf $HOME/go
   sudo rm -rf /usr/local/go
   wget https://dl.google.com/go/go1.14.4.linux-amd64.tar.gz
   sudo tar -C /usr/local -zxvf go1.14.4.linux-amd64.tar.gz
   mkdir -p ~/go/{bin,pkg,src}
   echo 'export GOPATH=$HOME/go' >> ~/.bashrc
   echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
   echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
   source ~/.bashrc
   go version
}

function install_gcc_upf() {
   cd $HOME
   source ~/.bashrc   
   sudo apt -y update
   sudo apt -y install git gcc cmake autoconf libtool pkg-config libmnl-dev libyaml-dev
   go get -u github.com/sirupsen/logrus
}

function install_GTP() {
   cd $HOME	
   git clone -b v0.1.0 https://github.com/PrinzOwO/gtp5g.git
   cd gtp5g
   source ~/.bashrc
   make
   sudo make install
}

function build_upf() {
   cd $HOME	
   git clone --recursive -b v3.0.3 -j `nproc` https://github.com/free5gc/free5gc.git
   cd ~/free5gc/src/upf
   mkdir build
   cd build
   source ~/.bashrc
   sudo apt-get -y install build-essential
   cmake ..
   make -j`nproc`
}

function deploy_gnbSim() {
   cd $HOME
   git clone https://github.com/H21lab/gnbsim
   cd gnbsim
   source ~/.bashrc
   export GOPATH=$HOME/go
   export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin
   make test
   make
}
function create_crd() {
  kubectl delete -f $CRD_FILE_PATH
  sleep 10s
  kubectl apply -f $CRD_FILE_PATH	
}
echo "Installing Docker"
install_docker
echo "Installing k8s"
install_k8s
echo "Installing weave CNI"
install_weave
echo "Configuring weave"
configure_weave
echo "Installing multus"
install_multus
echo "Installing helm"
install_helm
echo "Installing go"
install_go
echo "Installing gNbSimulator"
install_gcc_upf
echo "Installing GTP"
deploy_gnbSim
echo "Installing gcc and other packages required for UPF"
install_GTP
echo "Building UPF"
build_upf
echo "create CRD for free5gc"
create_crd
