# cloudnative5g

https://wiki.opnfv.org/pages/viewpage.action?pageId=63111404

https://wiki.onap.org/display/DW/CNF+2021+Meeting+Minutes

https://github.com/Orange-OpenSource/towards5gs-helm



## 1. 内核

```bash
apt-get update
# 查看可更新的内核
apt-cache search linux-image

uname -r
sudo apt-get install linux-image-5.0.0-23-generic
sudo apt-get install linux-headers-5.0.0-23-generic
sudo nano /etc/default/grub
GRUB_DEFAULT="Advanced options for Ubuntu > Ubuntu, with Linux 5.0.0-23-generic"
sudo update-grub
# rm -rf /boot/vmlinuz-5.0.0-34-generic
# rm -rf /boot/initrd.img-5.0.0-34-generic
sudo reboot

#设置禁止更新内核
sudo apt-mark hold linux-image-5.0.0-23-generic

#禁用自动更新
sudo nano /etc/apt/apt.conf.d/10periodic
APT::Periodic::Update-Package-Lists "0";
```
## 2. gtp5g
```bash
git clone -b v0.3.1 https://github.com/free5gc/gtp5g.git
cd gtp5g
make
sudo make install
```
## 3. Go
```bash
#此前安装过其他版本的Go时，需要进行下述操作：
sudo rm -rf /usr/local/go
wget https://dl.google.com/go/go1.14.4.linux-amd64.tar.gz
sudo tar -C /usr/local -zxvf go1.14.4.linux-amd64.tar.gz

#如果是第一次安装Go，需要进行下述操作：
wget https://dl.google.com/go/go1.14.4.linux-amd64.tar.gz
sudo tar -C /usr/local -zxvf go1.14.4.linux-amd64.tar.gz
mkdir -p ~/go/{bin,pkg,src}

echo 'export GOPATH=$HOME/go' >> ~/.zshrc
echo 'export GOROOT=/usr/local/go' >> ~/.zshrc
echo 'export PATH=$PATH:$GOPATH/bin:$GOROOT/bin' >> ~/.zshrc
source ~/.zshrc
```

## 4. 依赖包
```bash
#控制面依赖包
sudo apt -y update
sudo apt -y install mongodb wget git
sudo systemctl start mongodb

#控制面依赖包
sudo apt -y update
sudo apt -y install git gcc cmake autoconf libtool pkg-config libmnl-dev libyaml-dev
go get -u github.com/sirupsen/logrus
```

## 5. 网络设置
```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -o <dn_interface> -j MASQUERADE
sudo systemctl stop ufw
#此处的<dn_iptables>指的是真实网卡：lo、ens33或者ens38。
```

## 6. Free5gc
### Networks configuration

In this section, we'll suppose that you have only one interface on each Kubernetes node and its name is `ens4`. Then you have to set these parameters to `ens4`:

- `global.n2network.masterIf`
- `global.n3network.masterIf`
- `global.n4network.masterIf`
- `global.n6network.masterIf`
- `global.n9network.masterIf`



### Multus-cni
```
git clone https://github.com/k8snetworkplumbingwg/multus-cni.git
cat ./deployments/multus-daemonset-thick-plugin.yml | kubectl apply -f -
```


## 7. UERANSIM:
1. Run UE connectivity test by running these commands:
    ```
    helm --namespace onap4k8s test ueransim
    ```

If you want to run connectivity tests manually, follow:

1. Get the UE Pod name by running:
    ```
    export POD_NAME=$(kubectl get pods --namespace onap4k8s -l "component=ue" -o jsonpath="{.items[0].metadata.name}")
    ```

2. Check that uesimtun0 interface has been created by running these commands:
    ```
    kubectl --namespace onap4k8s logs $POD_NAME
    kubectl --namespace onap4k8s exec -it $POD_NAME -- ip address
    ```

3. Try to access internet from the UE by running:
    ```
    kubectl --namespace onap4k8s exec -it $POD_NAME -- ping -I uesimtun0 www.google.com
    kubectl --namespace onap4k8s exec -it $POD_NAME -- curl --interface uesimtun0 www.google.com
    kubectl --namespace onap4k8s exec -it $POD_NAME -- traceroute -i uesimtun0 www.google.com
    ```

