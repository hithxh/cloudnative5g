#!/usr/bin/env bash

function usage() {
    echo "How to use this"
    echo ""
    echo "./encode.sh"
    echo -e "\t-h --help"
    echo -e "\t-u = The user for the VM"
    echo -e "\t-p = The password for the vm user"
    echo -e "\t-gu = The user for git credentials to clone required repos"
    echo -e "\t-gp = password for the git user"
    echo -e "\t-vm_ip = The IP for the VM where amcop will be deployed"
}

while [ "$1" != "" ]; do
    PARAM=$(echo $1 | awk -F= '{print $1}')
    VALUE=$(echo $1 | awk -F= '{print $2}')
    case $PARAM in
    -h | --help)
        usage
        exit
        ;;
    -u)
        VM_USER=$VALUE
        ;;
    -p)
        VM_USER_PASSWORD=$VALUE
        ;;
    -gu)
        GIT_USER=$VALUE
        ;;
    -gp)
        GIT_USER_PASSWORD=$VALUE
        ;;
    -vm_ip)
        VM_IP=$VALUE
        ;;
    *)
        echo "ERROR: unknown parameter \"$PARAM\""
        usage
        exit 1
        ;;
    esac
    shift
done
if [ "$VM_USER" != "" ] || [ "$VM_USER_PASSWORD" != "" ] || [ "$VM_IP" != "" ] || [ "$GIT_USER" != "" ] || [ "$GIT_USER_PASSWORD" != "" ]; then
    echo "One of the required parameters were not provided, please check"
    exit 1
fi
VM_USER=$(echo $VM_USER | base64)
VM_USER_PASSWORD=$(echo $VM_USER_PASSWORD | base64)
GIT_USER=$(echo $GIT_USER | base64)
GIT_USER_PASSWORD=$(echo $GIT_USER_PASSWORD | base64)
VM_IP=$(echo $VM_IP | base64)
echo $(
    cat <<EOF
   {"vm_user" : "$VM_USER","vm_user_password": "$VM_USER_PASSWORD","git_user" : "$GIT_USER","git_password": "$GIT_USER_PASSWORD","vm_ip" : "$VM_IP"}
EOF
) >config.json
