# cloudnative5g

https://wiki.opnfv.org/pages/viewpage.action?pageId=63111404

https://wiki.onap.org/display/DW/CNF+2021+Meeting+Minutes


## kernel

## gcc
```
sudo apt install make
sudo apt install gcc
```

## gtp5g
```
git clone -b v0.3.1 https://github.com/free5gc/gtp5g.git
cd gtp5g
make
sudo make install
```

## Multus-cni
```
git clone https://github.com/k8snetworkplumbingwg/multus-cni.git
cat ./deployments/multus-daemonset-thick-plugin.yml | kubectl apply -f -
```


## UERANSIM:
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