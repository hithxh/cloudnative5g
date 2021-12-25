#!/bin/bash
#
# Common script to register a cloud, and instantiate vFW CNFs

# These are mandatory parameters to be provided
K8S_CONFIG="None"
CNF_PKG="None"
CNF_PROF="None"
# All the following have defaults (vFW on k8s cluster named "kud")
# which can be overridden
PAYLOAD_DIR="../payload"
CLOUD_REGION="kud"
RESOURCE_BUNDLE_NAME="test-vfw"
RESOURCE_BUNDLE_VERSION="v1"
COMP_APP_NAME="firewall"
PROFILE_NAME="p1"
RELEASE_NAME="r1"
K8S_NAMESPACE="testnamespace1"

SVC_IP=`kubectl get svc -n onap |grep "multicloud-k8s "|awk '{print $3}'`
SVC_PORT=9015

handleArgs(){
	for i in "$@"
	do
	case $i in
		--k8s_config=*)
		K8S_CONFIG="${i#*=}"
		;;
		--cnf_pkg=*)
		CNF_PKG="${i#*=}"
		;;
		--cnf_profile=*)
		CNF_PROF="${i#*=}"
		;;
		--payload_dir=*)
		PAYLOAD_DIR="${i#*=}"
		;;
		--cloud_region=*)
		CLOUD_REGION="${i#*=}"
		;;
		--rb_name=*)
		RESOURCE_BUNDLE_NAME="${i#*=}"
		;;
		--rb_version=*)
		RESOURCE_BUNDLE_VERSION="${i#*=}"
		;;
		--comp_app=*)
		COMP_APP_NAME="${i#*=}"
		;;
		--profile_mame=*)
		PROFILE_NAME="${i#*=}"
		;;
		--release_name=*)
		RELEASE_NAME="${i#*=}"
		;;
		--k8s_namespace=*)
		K8S_NAMESPACE="${i#*=}"
		;;
		*) # unknown option
		;;
	esac
	shift # past argument=value
	done
	set -- "${POSITIONAL[@]}" # restore positional parameters
}


handleArgs "$@"

if [ "$K8S_CONFIG"  = "None" ] || [ "$CNF_PKG" = "None" ] || [ "$CNF_PROF" = "None" ]
then
	echo "Usage: $0 --k8s_config=<k8s_config_file> --cnf_pkg=<cnf_pkg.tgz> --cnf_profile=<profile.tgz> --payload_dir=[payload_dir] --cloud_region=[cloud_name] --rb_name=[rb_name] --rb_version=[rb_version] --comp_app=[app_name] --profile_name=[profile_name] --release_name=[rel_name] --k8s_namespace=[k8s_namespace]"
    exit 1
fi

# Update payload files with the information
mkdir -p $PAYLOAD_DIR/tmp_cnf
 
cp -f $PAYLOAD_DIR/register_kud.template.json $PAYLOAD_DIR/tmp_cnf/register_kud.json
cp -f $PAYLOAD_DIR/create_rbinstance.template.json $PAYLOAD_DIR/tmp_cnf/create_rbinstance.json
cp -f $PAYLOAD_DIR/create_rbprofile.template.json $PAYLOAD_DIR/tmp_cnf/create_rbprofile.json
cp -f $PAYLOAD_DIR/create_rbdefinition.template.json $PAYLOAD_DIR/tmp_cnf/create_rbdefinition.json

sed -i "s|CLOUD_REGION|${CLOUD_REGION}|g" $PAYLOAD_DIR/tmp_cnf/register_kud.json
sed -i "s|CLOUD_REGION|${CLOUD_REGION}|g" $PAYLOAD_DIR/tmp_cnf/create_rbinstance.json

sed -i "s|RESOURCE_BUNDLE_NAME|${RESOURCE_BUNDLE_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbdefinition.json
sed -i "s|RESOURCE_BUNDLE_NAME|${RESOURCE_BUNDLE_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbinstance.json
sed -i "s|RESOURCE_BUNDLE_NAME|${RESOURCE_BUNDLE_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbprofile.json

sed -i "s|RESOURCE_BUNDLE_VERSION|${RESOURCE_BUNDLE_VERSION}|g" $PAYLOAD_DIR/tmp_cnf/create_rbdefinition.json
sed -i "s|RESOURCE_BUNDLE_VERSION|${RESOURCE_BUNDLE_VERSION}|g" $PAYLOAD_DIR/tmp_cnf/create_rbinstance.json
sed -i "s|RESOURCE_BUNDLE_VERSION|${RESOURCE_BUNDLE_VERSION}|g" $PAYLOAD_DIR/tmp_cnf/create_rbprofile.json

sed -i "s|COMP_APP_NAME|${COMP_APP_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbdefinition.json

sed -i "s|PROFILE_NAME|${PROFILE_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbinstance.json
sed -i "s|PROFILE_NAME|${PROFILE_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbprofile.json

sed -i "s|RELEASE_NAME|${RELEASE_NAME}|g" $PAYLOAD_DIR/tmp_cnf/create_rbprofile.json

sed -i "s|K8S_NAMESPACE|${K8S_NAMESPACE}|g" $PAYLOAD_DIR/tmp_cnf/create_rbprofile.json

#
# Register_kud_to_k8s
#
echo "Registering k8s cloud with onap4k8s"
curl -i -F "metadata=<${PAYLOAD_DIR}/tmp_cnf/register_kud.json;type=application/json" -F file=@${K8S_CONFIG} -X POST http://${SVC_IP}:${SVC_PORT}/v1/connectivity-info > /tmp/anod_cnf.log 2>&1

if [ ! $? -eq 0 ] 
then
	echo "Failed to register k8s cloud!"
	exit 1
fi

#
# Create_rb_definition
#
echo "Creating ResourceBundle (RB)"
curl -i -d @$PAYLOAD_DIR/tmp_cnf/create_rbdefinition.json -X POST http://${SVC_IP}:${SVC_PORT}/v1/rb/definition >> /tmp/anod_cnf.log 2>&1

if [ ! $? -eq 0 ] 
then
	echo "Failed to create resource bundle (RB)!"
	exit 1
fi

#
# Upload_artifact_to_definition
#
echo "Uploading Artifact definition (CNF Package)"
curl -i --data-binary @$CNF_PKG -X POST http://${SVC_IP}:${SVC_PORT}/v1/rb/definition/test-vfw/v1/content >> /tmp/anod_cnf.log 2>&1

if [ ! $? -eq 0 ] 
then
	echo "Failed to upload artifact definition!"
	exit 1
fi

#
# Create_rb_profile
#
echo "Creating ResourceBundle Profile"
curl -i -d @$PAYLOAD_DIR/tmp_cnf/create_rbprofile.json -X POST http://${SVC_IP}:${SVC_PORT}/v1/rb/definition/test-vfw/v1/profile >> /tmp/anod_cnf.log 2>&1

if [ ! $? -eq 0 ] 
then
	echo "Failed to create Resource Bundle (RB)!"
	exit 1
fi

#
# Upload_artifact_to_profile
#
echo "Uploading Artifacts to profile!"
curl -i --data-binary @$CNF_PROF -X POST http://${SVC_IP}:${SVC_PORT}/v1/rb/definition/test-vfw/v1/profile/p1/content >> /tmp/anod_cnf.log 2>&1

if [ ! $? -eq 0 ] 
then
	echo "Failed to create Resource Bundle (RB)!"
	exit 1
fi

#
# Create_rb_instance
#
echo "Create ResourceBundle Instance (CNF instantiation)!"
curl -d @$PAYLOAD_DIR/tmp_cnf/create_rbinstance.json http://${SVC_IP}:${SVC_PORT}/v1/instance >> /tmp/anod_cnf.log 2>&1

if [ ! $? -eq 0 ] 
then
	echo "Failed to create Resource Bundle (RB) Instance!"
	exit 1
fi

exit 0
