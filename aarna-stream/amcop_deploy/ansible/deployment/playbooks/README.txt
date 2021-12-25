This file documents the structure of the playbooks.
Playbooks has main files to deploy and undeploy AMCOP on
platforms such as baremetal,gke,aks and openshift

Additionaly, it has KUD cluster creation files as well

EMCO components deployment is common for all the platforms
These components are written in individual yaml files
to be able to include them as a single component. Any changes
to it will be done in one place that gets reflected across  all 
plaforms

Common folder contains files that are common to all the platforms
which will be included in other platform specific files.

Platform specific folders such aks, gke etc will have platform
specific deployment files.

#############

Ansibel deployment functions: 
1.emco_main.yaml - This file contains functions required
to deploy amcop components on bare metal servers
along with common functions such as git, ansible, helm 3 
etc on the remote host
2.gke_main.yaml - This file contains functions required
to deploy amcop components on GKE cloud infrastructure
along with common functions such as git, ansible, helm 3
etc on the remote host
3.aks_main.yaml - This file contains functions required
to deploy amcop components on AKS cloud infrastructure
along with common functions such as git, ansible, helm 3
etc on the remote host
4.openshift_main.yaml - This file contains functions required
to deploy amcop components on Openshift cloud infrastructure
along with common functions such as git, ansible, helm 3
etc on the remote host
5.setup_kud_cluster.yaml - This file contains functions required
to deploy KUD cluster for orchestration on a different server

Undeploy directory contains files to invoke uninstallation of
vm, cluster, onap and amcop components.

#####################
