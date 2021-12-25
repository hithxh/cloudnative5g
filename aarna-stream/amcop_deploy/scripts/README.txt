This folder contains scripts required to individually run to create cluster,
deloy emco components and undeploy AMCOP etc. It also has scripts required for 
AMCOP installation

alite_install.sh - This file is to create a kubespray cluster. It expects the 
cluster name, host ip and VM to create the cluster. If you are creating the
cluster, make sure the ansible, kube, docker and kubespray versions are
correctly updated in the config.sh file in config directory

emco_uninstall.sh - This file will uninstall emco components only.
 
alite_uninstall.sh - This file will undeploy onap components only

k8s_cluster_reset.sh - This file will reset the kubespray cluster only

cleanup.sh - This will delete the VM and cleanup files and folder created 
during deployment such as userdata for vm user creation, nfs mount folder
dockerdata-nfs and other configuration files created during deployment

The below files are from the deployment of emco components. DONT modify
these files as they are used internally by ansible during deployment.
 
middlend_config.sh
deploy_istio.sh  
