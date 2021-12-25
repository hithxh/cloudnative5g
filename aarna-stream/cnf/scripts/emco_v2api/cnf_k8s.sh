#!/bin/bash
#
# This is a generic CNF orchestration script that can be used for any 
# composite application. 
# The environment file (test_common.env) includes generic environment for 
# running the test. 
# Each application needs to have its own specific environment (eg., test_f5gc.env)
# If any variable is not defined, vFW is assumed!

set -o errexit
set -o nounset
set -o pipefail

source _functions.sh

# Test env
source test_common.env
# Enable this to test Free5gc
source test_f5gc.env
# Enable this to test vFW
# source test_vfw.env

# add clusters to clm
# TODO one is added by default, add more if vfw demo is
#      extended to multiple clusters
clusterprovidername=${cluster_provider_name:-"vfw-cluster-provider"}
clusterproviderdata="$(cat<<EOF
{
  "metadata": {
    "name": "$clusterprovidername",
    "description": "description of $clusterprovidername",
    "userData1": "$clusterprovidername user data 1",
    "userData2": "$clusterprovidername user data 2"
  }
}
EOF
)"

clustername=${cluster_name:-"edge01"}
clusterdata="$(cat<<EOF
{
  "metadata": {
    "name": "$clustername",
    "description": "description of $clustername",
    "userData1": "$clustername user data 1",
    "userData2": "$clustername user data 2"
  }
}
EOF
)"

# set $kubeconfigfile before running script to point to the desired config file
kubeconfigfile=${kubeconfig_file:-"oops"}

# TODO consider demo of cluster label based placement
#      could use to onboard multiple clusters for vfw
#      but still deploy to just 1 cluster based on label
labelname=${label_name:-"LabelA"}
labeldata="$(cat<<EOF
{"label-name": "$labelname"}
EOF
)"


# add the rsync controller entry
rsynccontrollername="rsync"
rsynccontrollerdata="$(cat<<EOF
{
  "metadata": {
    "name": "rsync",
    "description": "description of $rsynccontrollername controller",
    "userData1": "user data 1 for $rsynccontrollername",
    "userData2": "user data 2 for $rsynccontrollername"
  },
  "spec": {
    "host": "${rsynccontrollername}",
    "port": 9041 
  }
}
EOF
)"

# add the rsync controller entry
ovnactioncontrollername="ovnaction"
ovnactioncontrollerdata="$(cat<<EOF
{
  "metadata": {
    "name": "$ovnactioncontrollername",
    "description": "description of $ovnactioncontrollername controller",
    "userData1": "user data 2 for $ovnactioncontrollername",
    "userData2": "user data 2 for $ovnactioncontrollername"
  },
  "spec": {
    "host": "${ovnactioncontrollername}",
    "type": "action",
    "priority": 1,
    "port": 9053 
  }
}
EOF
)"


# define networks and providernetworks intents to ncm for the clusters
#      define emco-private-net and unprotexted-private-net as provider networks

emcoprovidernetworkname="emco-private-net"
emcoprovidernetworkdata="$(cat<<EOF
{
  "metadata": {
    "name": "$emcoprovidernetworkname",
    "description": "description of $emcoprovidernetworkname",
    "userData1": "user data 1 for $emcoprovidernetworkname",
    "userData2": "user data 2 for $emcoprovidernetworkname"
  },
  "spec": {
      "cniType": "ovn4nfv",
      "ipv4Subnets": [
          {
              "subnet": "10.10.20.0/24",
              "name": "subnet1",
              "gateway":  "10.10.20.1/24"
          }
      ],
      "providerNetType": "VLAN",
      "vlan": {
          "vlanId": "102",
          "providerInterfaceName": "eth1",
          "logicalInterfaceName": "eth1.102",
          "vlanNodeSelector": "specific",
          "nodeLabelList": [
              "kubernetes.io/hostname=localhost"
          ]
      }
  }
}
EOF
)"

unprotectedprovidernetworkname="unprotected-private-net"
unprotectedprovidernetworkdata="$(cat<<EOF
{
  "metadata": {
    "name": "$unprotectedprovidernetworkname",
    "description": "description of $unprotectedprovidernetworkname",
    "userData1": "user data 2 for $unprotectedprovidernetworkname",
    "userData2": "user data 2 for $unprotectedprovidernetworkname"
  },
  "spec": {
      "cniType": "ovn4nfv",
      "ipv4Subnets": [
          {
              "subnet": "192.168.10.0/24",
              "name": "subnet1",
              "gateway":  "192.168.10.1/24"
          }
      ],
      "providerNetType": "VLAN",
      "vlan": {
          "vlanId": "100",
          "providerInterfaceName": "eth1",
          "logicalInterfaceName": "eth1.100",
          "vlanNodeSelector": "specific",
          "nodeLabelList": [
              "kubernetes.io/hostname=localhost"
          ]
      }
  }
}
EOF
)"

protectednetworkname="protected-private-net"
protectednetworkdata="$(cat<<EOF
{
  "metadata": {
    "name": "$protectednetworkname",
    "description": "description of $protectednetworkname",
    "userData1": "user data 1 for $protectednetworkname",
    "userData2": "user data 1 for $protectednetworkname"
  },
  "spec": {
      "cniType": "ovn4nfv",
      "ipv4Subnets": [
          {
              "subnet": "192.168.20.0/24",
              "name": "subnet1",
              "gateway":  "192.168.20.100/32"
          }
      ]
  }
}
EOF
)"

# define a project
projectname=${project_name:-"testvfw"}
projectdata="$(cat<<EOF
{
  "metadata": {
    "name": "$projectname",
    "description": "description of $projectname controller",
    "userData1": "$projectname user data 1",
    "userData2": "$projectname user data 2"
  }
}
EOF
)"

# define a composite application
compositeapp_name=${composite_app_name:-"compositevfw"}
compositeapp_version=${composite_app_version:-"v1"}
compositeapp_data="$(cat <<EOF
{
  "metadata": {
    "name": "${compositeapp_name}",
    "description": "description of ${compositeapp_name}",
    "userData1": "user data 1 for ${compositeapp_name}",
    "userData2": "user data 2 for ${compositeapp_name}"
   },
   "spec":{
      "version":"${compositeapp_version}"
   }
}
EOF
)"

# define app entries for the composite application
#   includes the multipart tgz of the helm chart for vfw
# BEGIN: Create entries for app1&app2 in the database
app1_name=${app_1_name:-"packetgen"}
app1_helm_chart=${app_1_helm_path:-"oops"}
app1_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app1_name}",
    "description": "description for app ${app1_name}",
    "userData1": "user data 2 for ${app1_name}",
    "userData2": "user data 2 for ${app1_name}"
   }
}
EOF
)"

app2_name=${app_2_name:-"firewall"}
app2_helm_chart=${app_2_helm_path:-"oops"}
app2_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app2_name}",
    "description": "description for app ${app2_name}",
    "userData1": "user data 2 for ${app2_name}",
    "userData2": "user data 2 for ${app2_name}"
   }
}
EOF
)"

app3_name=${app_3_name:-"sink"}
app3_helm_chart=${app_3_helm_path:-"oops"}
app3_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app3_name}",
    "description": "description for app ${app3_name}",
    "userData1": "user data 2 for ${app3_name}",
    "userData2": "user data 2 for ${app3_name}"
   }
}
EOF
)"


# Add the composite profile
composite_profile_name=${composite_prof_name:-"vfw_composite-profile"}
composite_profile_data="$(cat <<EOF
{
   "metadata":{
      "name":"${composite_profile_name}",
      "description":"description of ${composite_profile_name}",
      "userData1":"user data 1 for ${composite_profile_name}",
      "userData2":"user data 2 for ${composite_profile_name}"
   }
}
EOF
)"


# define the app1 profile data
app1_profile_name=${app_1_profile_name:-"packetgen-profile"}
app1_profile_file=${app_1_profile_targz:-"oops"}
app1_profile_data="$(cat <<EOF
{
   "metadata":{
      "name":"${app1_profile_name}",
      "description":"description of ${app1_profile_name}",
      "userData1":"user data 1 for ${app1_profile_name}",
      "userData2":"user data 2 for ${app1_profile_name}"
   },
   "spec":{
      "app-name":  "${app1_name}"
   }
}
EOF
)"

# define the app2 profile data
app2_profile_name=${app_2_profile_name:-"firewall-profile"}
app2_profile_file=${app_2_profile_targz:-"oops"}
app2_profile_data="$(cat <<EOF
{
   "metadata":{
      "name":"${app2_profile_name}",
      "description":"description of ${app2_profile_name}",
      "userData1":"user data 1 for ${app2_profile_name}",
      "userData2":"user data 2 for ${app2_profile_name}"
   },
   "spec":{
      "app-name":  "${app2_name}"
   }
}
EOF
)"

# define the app3 profile data
app3_profile_name=${app_3_profile_name:-"sink-profile"}
app3_profile_file=${app_3_profile_targz:-"oops"}
app3_profile_data="$(cat <<EOF
{
   "metadata":{
      "name":"${app3_profile_name}",
      "description":"description of ${app3_profile_name}",
      "userData1":"user data 1 for ${app3_profile_name}",
      "userData2":"user data 2 for ${app3_profile_name}"
   },
   "spec":{
      "app-name":  "${app3_name}"
   }
}
EOF
)"


# define the generic placement intent
generic_placement_intent_name="generic-placement-intent"
generic_placement_intent_data="$(cat <<EOF
{
   "metadata":{
      "name":"${generic_placement_intent_name}",
      "description":"${generic_placement_intent_name}",
      "userData1":"${generic_placement_intent_name}",
      "userData2":"${generic_placement_intent_name}"
   },
   "spec":{
      "logical-cloud":"unused_logical_cloud"
   }
}
EOF
)"


# define app placement intent for packetgen
app1_placement_intent_name=${app_1_placement_intent_name:-"packetgen-placement-intent"}
app1_placement_intent_data="$(cat <<EOF
{
   "metadata":{
      "name":"${app1_placement_intent_name}",
      "description":"description of ${app1_placement_intent_name}",
      "userData1":"user data 1 for ${app1_placement_intent_name}",
      "userData2":"user data 2 for ${app1_placement_intent_name}"
   },
   "spec":{
      "app-name":"${app1_name}",
      "intent":{
         "allOf":[
            {  "provider-name":"${clusterprovidername}",
               "cluster-label-name":"${labelname}"
            }
         ]
      }
   }
}
EOF
)"

# define app placement intent for firewall
app2_placement_intent_name=${app_2_placement_intent_name:-"firewall-placement-intent"}
app2_placement_intent_data="$(cat <<EOF
{
   "metadata":{
      "name":"${app2_placement_intent_name}",
      "description":"description of ${app2_placement_intent_name}",
      "userData1":"user data 1 for ${app2_placement_intent_name}",
      "userData2":"user data 2 for ${app2_placement_intent_name}"
   },
   "spec":{
      "app-name":"${app2_name}",
      "intent":{
         "allOf":[
            {  "provider-name":"${clusterprovidername}",
               "cluster-label-name":"${labelname}"
            }
         ]
      }
   }
}
EOF
)"

# define app placement intent for sink
app3_placement_intent_name=${app_3_placement_intent_name:-"sink-placement-intent"}
app3_placement_intent_data="$(cat <<EOF
{
   "metadata":{
      "name":"${app3_placement_intent_name}",
      "description":"description of ${app3_placement_intent_name}",
      "userData1":"user data 1 for ${app3_placement_intent_name}",
      "userData2":"user data 2 for ${app3_placement_intent_name}"
   },
   "spec":{
      "app-name":"${app3_name}",
      "intent":{
         "allOf":[
            {  "provider-name":"${clusterprovidername}",
               "cluster-label-name":"${labelname}"
            }
         ]
      }
   }
}
EOF
)"

# define a deployment intent group
release=${release_name:-"fw0"}
deployment_intent_group_name=${deploymentintent_group_name:-"vfw_deployment_intent_group"}
deployment_intent_group_data="$(cat <<EOF
{
   "metadata":{
      "name":"${deployment_intent_group_name}",
      "description":"descriptiont of ${deployment_intent_group_name}",
      "userData1":"user data 1 for ${deployment_intent_group_name}",
      "userData2":"user data 2 for ${deployment_intent_group_name}"
   },
   "spec":{
      "profile":"${composite_profile_name}",
      "version":"${release}",
      "override-values":[
         {
            "app-name":"${app1_name}",
            "values": {
                  ".Values.service.ports.nodePort":"30888"
               }
         },
         {
            "app-name":"${app2_name}",
            "values": {
                  ".Values.global.dcaeCollectorIp":"1.2.3.4",
                  ".Values.global.dcaeCollectorPort":"8888"
               }
         },
         {
            "app-name":"${app3_name}",
            "values": {
                  ".Values.service.ports.nodePort":"30677"
               }
         }
      ]
   }
}
EOF
)"

# define the network-control-intent for the vfw composite app
ovnaction_intent_name=${ovn_action_intent_name:-"vfw_ovnaction_intent"}
ovnaction_intent_data="$(cat <<EOF
{
   "metadata":{
      "name":"${ovnaction_intent_name}",
      "description":"descriptionf of ${ovnaction_intent_name}",
      "userData1":"user data 1 for ${ovnaction_intent_name}",
      "userData2":"user data 2 for ${ovnaction_intent_name}"
   }
}
EOF
)"

# define the network workload intent for packetgen app
app1_workload_intent_name=${app_1_workload_intent_name:-"packetgen_workload_intent"}
app1_workload_intent_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app1_workload_intent_name}",
    "description": "description of ${app1_workload_intent_name}",
    "userData1": "useer data 2 for ${app1_workload_intent_name}",
    "userData2": "useer data 2 for ${app1_workload_intent_name}"
  },
  "spec": {
    "application-name": "${app1_name}",
    "workload-resource": "${release}-${app1_name}",
    "type": "Deployment"
  }
}
EOF
)"

# define the network workload intent for firewall app
app2_workload_intent_name=${app_2_workload_intent_name:-"firewall_workload_intent"}
app2_workload_intent_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app2_workload_intent_name}",
    "description": "description of ${app2_workload_intent_name}",
    "userData1": "useer data 2 for ${app2_workload_intent_name}",
    "userData2": "useer data 2 for ${app2_workload_intent_name}"
  },
  "spec": {
    "application-name": "${app2_name}",
    "workload-resource": "${release}-${app2_name}",
    "type": "Deployment"
  }
}
EOF
)"

# define the network workload intent for sink app
app3_workload_intent_name=${app_3_workload_intent_name:-"sink_workload_intent"}
app3_workload_intent_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app3_workload_intent_name}",
    "description": "description of ${app3_workload_intent_name}",
    "userData1": "useer data 2 for ${app3_workload_intent_name}",
    "userData2": "useer data 2 for ${app3_workload_intent_name}"
  },
  "spec": {
    "application-name": "${app3_name}",
    "workload-resource": "${release}-${app3_name}",
    "type": "Deployment"
  }
}
EOF
)"

# define the network interface intents for the packetgen workload intent
app1_unprotected_interface_name=${app_1_unprotected_if:-"packetgen_unprotected_if"}
app1_unprotected_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app1_unprotected_interface_name}",
    "description": "description of ${app1_unprotected_interface_name}",
    "userData1": "useer data 2 for ${app1_unprotected_interface_name}",
    "userData2": "useer data 2 for ${app1_unprotected_interface_name}"
  },
  "spec": {
    "interface": "eth1",
    "name": "${unprotectedprovidernetworkname}",
    "defaultGateway": "false",
    "ipAddress": "192.168.10.2"
  }
}
EOF
)"

app1_emco_interface_name=${app_1_emco_if:-"packetgen_emco_if"}
app1_emco_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app1_emco_interface_name}",
    "description": "description of ${app1_emco_interface_name}",
    "userData1": "useer data 2 for ${app1_emco_interface_name}",
    "userData2": "useer data 2 for ${app1_emco_interface_name}"
  },
  "spec": {
    "interface": "eth2",
    "name": "${emcoprovidernetworkname}",
    "defaultGateway": "false",
    "ipAddress": "10.10.20.2"
  }
}
EOF
)"

# define the network interface intents for the firewall workload intent
app2_unprotected_interface_name=${app_2_unprotected_if:-"firewall_unprotected_if"}
app2_unprotected_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app2_unprotected_interface_name}",
    "description": "description of ${app2_unprotected_interface_name}",
    "userData1": "useer data 2 for ${app2_unprotected_interface_name}",
    "userData2": "useer data 2 for ${app2_unprotected_interface_name}"
  },
  "spec": {
    "interface": "eth1",
    "name": "${unprotectedprovidernetworkname}",
    "defaultGateway": "false",
    "ipAddress": "192.168.10.3"
  }
}
EOF
)"

app2_protected_interface_name=${app_2_protected_if:-"firewall_protected_if"}
app2_protected_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app2_protected_interface_name}",
    "description": "description of ${app2_protected_interface_name}",
    "userData1": "useer data 2 for ${app2_protected_interface_name}",
    "userData2": "useer data 2 for ${app2_protected_interface_name}"
  },
  "spec": {
    "interface": "eth2",
    "name": "${protectednetworkname}",
    "defaultGateway": "false",
    "ipAddress": "192.168.20.2"
  }
}
EOF
)"

app2_emco_interface_name=${app_2_emco_if:-"firewall_emco_if"}
app2_emco_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app2_emco_interface_name}",
    "description": "description of ${app2_emco_interface_name}",
    "userData1": "useer data 2 for ${app2_emco_interface_name}",
    "userData2": "useer data 2 for ${app2_emco_interface_name}"
  },
  "spec": {
    "interface": "eth3",
    "name": "${emcoprovidernetworkname}",
    "defaultGateway": "false",
    "ipAddress": "10.10.20.3"
  }
}
EOF
)"

# define the network interface intents for the sink workload intent
app3_protected_interface_name=${app_3_protected_if:-"sink_protected_if"}
app3_protected_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app3_protected_interface_name}",
    "description": "description of ${app3_protected_interface_name}",
    "userData1": "useer data 2 for ${app3_protected_interface_name}",
    "userData2": "useer data 2 for ${app3_protected_interface_name}"
  },
  "spec": {
    "interface": "eth1",
    "name": "${protectednetworkname}",
    "defaultGateway": "false",
    "ipAddress": "192.168.20.3"
  }
}
EOF
)"

app3_emco_interface_name=${app_3_emco_if:-"sink_emco_if"}
app3_emco_interface_data="$(cat <<EOF
{
  "metadata": {
    "name": "${app3_emco_interface_name}",
    "description": "description of ${app3_emco_interface_name}",
    "userData1": "useer data 2 for ${app3_emco_interface_name}",
    "userData2": "useer data 2 for ${app3_emco_interface_name}"
  },
  "spec": {
    "interface": "eth2",
    "name": "${emcoprovidernetworkname}",
    "defaultGateway": "false",
    "ipAddress": "10.10.20.4"
  }
}
EOF
)"

# define the intents to be used by the group
deployment_intents_in_group_name=${deployment_intents_in_group:-"vfw_deploy_intents"}
deployment_intents_in_group_data="$(cat <<EOF
{
   "metadata":{
      "name":"${deployment_intents_in_group_name}",
      "description":"descriptionf of ${deployment_intents_in_group_name}",
      "userData1":"user data 1 for ${deployment_intents_in_group_name}",
      "userData2":"user data 2 for ${deployment_intents_in_group_name}"
   },
   "spec":{
      "intent":{
         "genericPlacementIntent":"${generic_placement_intent_name}",
         "ovnaction" : "${ovnaction_intent_name}"
      }
   }
}
EOF
)"


function createOvnactionData {
    call_api -d "${ovnaction_intent_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent"

    call_api -d "${app1_workload_intent_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents"
    call_api -d "${app2_workload_intent_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents"
    call_api -d "${app3_workload_intent_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents"

    call_api -d "${app1_emco_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}/interfaces"
    call_api -d "${app1_unprotected_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}/interfaces"

    call_api -d "${app2_emco_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces"
    call_api -d "${app2_unprotected_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces"
    call_api -d "${app2_protected_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces"

    call_api -d "${app3_emco_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}/interfaces"
    call_api -d "${app3_protected_interface_data}" \
             "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}/interfaces"
}

function createOrchData {
    print_msg "creating controller entries"
    call_api -d "${rsynccontrollerdata}" "${base_url_orchestrator}/controllers"
    call_api -d "${ovnactioncontrollerdata}" "${base_url_orchestrator}/controllers"

    print_msg "creating project entry"
    call_api -d "${projectdata}" "${base_url_orchestrator}/projects"

    print_msg "creating vfw composite app entry"
    call_api -d "${compositeapp_data}" "${base_url_orchestrator}/projects/${projectname}/composite-apps"

    print_msg "adding apps to the composite app"
    call_api -F "metadata=${app1_data}" \
             -F "file=@${app1_helm_chart}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps"
    call_api -F "metadata=${app2_data}" \
             -F "file=@${app2_helm_chart}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps"
    call_api -F "metadata=${app3_data}" \
             -F "file=@${app3_helm_chart}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps"

    print_msg "creating composite profile entry"
    call_api -d "${composite_profile_data}" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles"

    print_msg "adding vfw app profiles to the composite profile"
    call_api -F "metadata=${app1_profile_data}" \
             -F "file=@${app1_profile_file}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles"
    call_api -F "metadata=${app2_profile_data}" \
             -F "file=@${app2_profile_file}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles"
    call_api -F "metadata=${app3_profile_data}" \
             -F "file=@${app3_profile_file}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles"

    print_msg "create the generic placement intent"
    call_api -d "${generic_placement_intent_data}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents"

    print_msg "add the app placement intents to the generic placement intent"
    call_api -d "${app1_placement_intent_data}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents"
    call_api -d "${app2_placement_intent_data}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents"
    call_api -d "${app3_placement_intent_data}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents"

    createOvnactionData

    print_msg "create the deployment intent group"
    call_api -d "${deployment_intent_group_data}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups"
    call_api -d "${deployment_intents_in_group_data}" \
             "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/intents"
}

function createNcmData {
    print_msg "Creating cluster provider and cluster"
    call_api -d "${clusterproviderdata}" "${base_url_clm}/cluster-providers"
    call_api -H "Content-Type: multipart/form-data" -F "metadata=$clusterdata" -F "file=@$kubeconfigfile" "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters"
    call_api -d "${labeldata}" "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/labels"

    print_msg "Creating provider network and network intents"
    call_api -d "${emcoprovidernetworkdata}" "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/provider-networks"
    call_api -d "${unprotectedprovidernetworkdata}" "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/provider-networks"
    call_api -d "${protectednetworkdata}" "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/networks"

}


function createData {
    createNcmData
    createOrchData  # this will call createOvnactionData
}

function getOvnactionData {
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}"

    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}"
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}"
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}"

    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}/interfaces/${app1_emco_interface_name}"
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}/interfaces/${app1_unprotected_interface_name}"

    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces/${app2_emco_interface_name}"
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces/${app2_unprotected_interface_name}"
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces/${app2_protected_interface_name}"

    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}/interfaces/${app3_emco_interface_name}"
    call_api_nox "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}/interfaces/${app3_protected_interface_name}"
}

function getOrchData {
    call_api_nox "${base_url_orchestrator}/controllers/${rsynccontrollername}"
    call_api_nox "${base_url_orchestrator}/controllers/${ovnactioncontrollername}"


    call_api_nox "${base_url_orchestrator}/projects/${projectname}"

    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}"

    call_api_nox -H "Accept: application/json" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps/${app1_name}"
    call_api_nox -H "Accept: application/json" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps/${app2_name}"
    call_api_nox -H "Accept: application/json" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps/${app3_name}"

    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}"

    call_api_nox -H "Accept: application/json" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles/${app1_profile_name}"
    call_api_nox -H "Accept: application/json" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles/${app2_profile_name}"
    call_api_nox -H "Accept: application/json" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles/${app3_profile_name}"

    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}"

    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents/${app1_placement_intent_name}"
    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents/${app2_placement_intent_name}"
    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents/${app3_placement_intent_name}"

    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}"
    call_api_nox "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/intents/${deployment_intents_in_group_name}"
}

function getNcmData {
    call_api_nox "${base_url_clm}/cluster-providers/${clusterprovidername}"
    call_api_nox -H "Accept: application/json" "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters/${clustername}"
    call_api_nox "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/labels/${labelname}"
    call_api_nox "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters?label=${labelname}"

    call_api_nox "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/provider-networks/${emcoprovidernetworkname}"
    call_api_nox "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/provider-networks/${unprotectedprovidernetworkname}"
    call_api_nox "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/networks/${protectednetworkname}"

}

function getData {
    getNcmData
    getOrchData
    getOvnactionData
}

function deleteOvnactionData {
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}/interfaces/${app3_protected_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}/interfaces/${app3_emco_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces/${app2_protected_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces/${app2_unprotected_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}/interfaces/${app2_emco_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}/interfaces/${app1_unprotected_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}/interfaces/${app1_emco_interface_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app3_workload_intent_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app2_workload_intent_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}/workload-intents/${app1_workload_intent_name}"
    delete_resource "${base_url_ovnaction}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/network-controller-intent/${ovnaction_intent_name}"
}

function deleteOrchData {
    delete_resource "${base_url_orchestrator}/controllers/${rsynccontrollername}"
    delete_resource "${base_url_orchestrator}/controllers/${ovnactioncontrollername}"

    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/intents/${deployment_intents_in_group_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}"

    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents/${app3_placement_intent_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents/${app2_placement_intent_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}/app-intents/${app1_placement_intent_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/generic-placement-intents/${generic_placement_intent_name}"

    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles/${app3_profile_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles/${app2_profile_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}/profiles/${app1_profile_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/composite-profiles/${composite_profile_name}"

    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps/${app3_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps/${app2_name}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/apps/${app1_name}"

    deleteOvnactionData

    delete_resource "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}"
    delete_resource "${base_url_orchestrator}/projects/${projectname}"
}

function deleteNcmData {
    delete_resource "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/networks/${protectednetworkname}"
    delete_resource "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/provider-networks/${unprotectedprovidernetworkname}"
    delete_resource "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/provider-networks/${emcoprovidernetworkname}"
    delete_resource "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/labels/${labelname}"
    delete_resource "${base_url_clm}/cluster-providers/${clusterprovidername}/clusters/${clustername}"
    delete_resource "${base_url_clm}/cluster-providers/${clusterprovidername}"
}

function deleteData {
    deleteNcmData
    deleteOrchData
}

# apply the network and providernetwork to an appcontext and instantiate with rsync
function applyNcmData {
    call_api -d "{ }" "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/apply"
}

# deletes the network resources from the clusters and the associated appcontext entries
function terminateNcmData {
    call_api -d "{ }" "${base_url_ncm}/cluster-providers/${clusterprovidername}/clusters/${clustername}/terminate"
}

# terminates the vfw resources
function terminateOrchData {
    call_api -d "{ }" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/terminate"
}

# terminates the vfw and ncm resources
function terminateVfw {
    terminateOrchData
    terminateNcmData
}

function instantiateVfw {
    call_api -d "{ }" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/approve"
    call_api -d "{ }" "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/instantiate"
}

function statusVfw {
    call_api "${base_url_orchestrator}/projects/${projectname}/composite-apps/${compositeapp_name}/${compositeapp_version}/deployment-intent-groups/${deployment_intent_group_name}/status"
}

function usage {
    echo "Usage: $0  create|get|delete|apply|terminate|instantiate"
    echo "    create - creates all ncm, ovnaction, clm resources needed for vfw"
    echo "             following env variables need to be set for create:"
    echo "                 kubeconfigfile=<path of kubeconfig file for destination cluster>"
    echo "                 app1_helm_path=<path to helm chart file for the packet generator>"
    echo "                 app2_helm_path=<path to helm chart file for the app2>"
    echo "                 app3_helm_path=<path to helm chart file for the app3>"
    echo "                 app1_profile_targz=<path to profile tar.gz file for the packet generator>"
    echo "                 app2_profile_targz=<path to profile tar.gz file for the app2>"
    echo "                 app3_profile_targz=<path to profile tar.gz file for the app3>"
    echo "    get - queries all resources in ncm, ovnaction, clm resources created for vfw"
    echo "    delete - deletes all resources in ncm, ovnaction, clm resources created for vfw"
    echo "    apply - applys the network intents - e.g. networks created in ncm"
    echo "    instantiate - approves and instantiates the composite app via the generic deployment intent"
    echo "    status - get status of deployed resources"
    echo "    terminate - remove the vFW composite app resources and network resources create by 'instantiate' and 'apply'"
    echo ""
    echo "    a reasonable test sequence:"
    echo "    1.  create"
    echo "    2.  apply"
    echo "    3.  instantiate"
    echo "    4.  status"
    echo "    5.  terminate"

    exit
}

function check_for_env_settings {
    ok=""
    if [ "${kubeconfigfile}" == "oops" ] ; then
        echo -e "ERROR - kubeconfigfile environment variable needs to be set"
        ok="no"
    fi
    if [ "${app1_helm_chart}" == "oops" ] ; then
        echo -e "ERROR - app_1_helm_path environment variable needs to be set"
        ok="no"
    fi
    if [ "${app2_helm_chart}" == "oops" ] ; then
        echo -e "ERROR - app_2_helm_path environment variable needs to be set"
        ok="no"
    fi
    if [ "${app3_helm_chart}" == "oops" ] ; then
        echo -e "ERROR - app_3_helm_path environment variable needs to be set"
        ok="no"
    fi
    if [ "${app1_profile_file}" == "oops" ] ; then
        echo -e "ERROR - app_1_profile_targz environment variable needs to be set"
        ok="no"
    fi
    if [ "${app2_profile_file}" == "oops" ] ; then
        echo -e "ERROR - app_2_profile_targz environment variable needs to be set"
        ok="no"
    fi
    if [ "${app3_profile_file}" == "oops" ] ; then
        echo -e "ERROR - app_3_profile_targz environment variable needs to be set"
        ok="no"
    fi
    if [ "${ok}" == "no" ] ; then
        echo ""
        usage
    fi
}

if [ "$#" -ne 1 ] ; then
    usage
fi

case "$1" in
    "create" )
        check_for_env_settings
        createData
        ;;
    "get" )    getData ;;
    "delete" ) deleteData ;;
    "apply" ) applyNcmData ;;
    "instantiate" ) instantiateVfw ;;
    "terminate" ) terminateVfw ;;
    "status" ) statusVfw ;;
    *) usage ;;
esac
