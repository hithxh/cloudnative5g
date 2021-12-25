This file documents the structure and logic behind ansible deployment 
for all the plaforms

Supported OS: Ubuntu and CentOS
Supported Platforms: Bare Metal, GKE, AKS and Openshift
Doc Reference: AMCOP user guide, AMCOP quick start guide

User is expected to clone the repo in the $HOME/<user_dir> directory.
The aarna-stream in the $HOME will be deleted whenever a new deployment
is triggered

#############

main.yaml - This is the main file from where all the specific platforms 
and OS support calls are made. Main file does the following jobs
1. Creating all common components that are required for the deployment
2. Checking the major pre-requisites such as ansible version and jq installation
3. Platform specific calls are made based on conditions

Config folder has deployment.json file which defines deployment specific 
details such as VM information, cluster details, EMCO and ONAP component details.

Ansibel deployment functions: main.yaml will invoke platform specific playbooks 
such as bm_main.yml, gke_main.yml, aks_main.yml or openshit_main.yaml. bm_main.yml 
invokes roles to create VM, Cluster, EMCO and ONAP components. 
Roles will intern call specific shell scripts in ~/aarna-stream/util-scripts 
to get the configuration details

Flow is as follows
1. bm_main.yml-->roles-->script-->playbooks
2. gke_main.yml-->playbooks-->script
3. aks_main.yml-->playbooks-->script 
4. openshit_main.yaml-->playbooks-->script

#############

Platform specific yaml files are:
 
1. bm_main.yml - Execution of this file will create a vm from the configuration 
file, setup kubernets cluster using kubespray and deploy emco and onap components. 
Checks are made before deploying emco and onap components to make sure 
cluser is formed already.

2. gke_main.yml - Execution of this file will create a cluster and deploy 
emco and onap components on GOOGLE cloud. Cluster and VMs are internal 
to google cloud deployment.

3. aks_main.yml - Execution of this file will create a cluster and deploy 
emco and onap components on AZURE cloud. Cluster and VMs are internal 
to azure cloud deployment

4. openshit_main.yaml-  Execution of this file will create a cluster and deploy 
emco and onap components on OPENSHIFT Cluster. Cluster and VMs are internal 
to Openshift cluster deployment 

#############

Cleanup files for AMCOP deployment

amcop_cleanup.yml - Cleans up AMCOP deployment. The cleanup can be done with 
the flag to cleanup only part of the deployment or the full deployment.

gke_cluster_reset.yml - Cleans up the cluster and AMCOP deployment fully. 
No option is given to undeploy part of the deployment

aks_cluster_reset.yml - Cleans up the cluster and AMCOP deployment fully. 
No option is given to undeploy part of the deployment
