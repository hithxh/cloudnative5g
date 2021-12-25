#!/bin/bash

CLUS_NAME=$1
ANOD_LITE_LOG_FOLDER=$2

# This script will create a KUD cluster on a GCP VM
# This cluster can then be used for orchestration 


# NOTE: These two steps are only needed one time, once the image is created we don't need it
#gcloud compute disks create kud-setup-disk --image-project ubuntu-os-cloud --image-family ubuntu-1804-lts --zone us-central1-f --size 200GB
#gcloud compute images create nested-vm-image-kud --source-disk kud-setup-disk --source-disk-zone us-central1-f --licenses "https://www.googleapis.com/compute/v1/projects/vm-options/global/licenses/enable-vmx"

gcloud compute instances create $CLUS_NAME --zone us-central1-f --custom-cpu 16 --custom-memory 32GB  --image nested-vm-image-kud  --min-cpu-platform "Intel Haswell" 2>&1 >$ANOD_LITE_LOG_FOLDER/create_gke_kud.log

sleep 120 

# ssh to above VM
gcloud compute ssh ${CLUS_NAME} --command="sudo apt-get update -y ; sudo apt-get upgrade -y ; sudo apt-get install -y python-pip" --  -t

gcloud compute ssh ${CLUS_NAME} --command="git clone https://git.onap.org/multicloud/k8s/" -- -t

# To run the stuff in background, we need to skip the -t flag here
gcloud compute ssh ${CLUS_NAME} --command="cd  k8s/kud/hosting_providers/baremetal/ ; nohup ./aio.sh &> /tmp/nohup.out < /dev/null & " 

echo "Setup, initiated, please wait for 15 min for the install to complete."
echo "To check logs, use below command:"
echo "         gcloud compute ssh ${CLUS_NAME} --command=\"tail -f  /tmp/nohup.out \" -- -t"

