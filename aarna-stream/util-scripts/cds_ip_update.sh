#!/bin/bash
IP=$(kubectl get svc -n amcop-system | grep "cds-blueprints-processor-http" | awk '{print $3}')
echo "ip of cds-blueprints-processor-http is $IP"
sudo docker run -it -d --name="ip_edit" registry.gitlab.com/pavansamudrala/xtesting/cds-healthcheck:cds-healthcheck-master /bin/bash
C_ID=$(sudo docker ps | grep "ip_edit" | awk '{print $1}')
echo "Container ID is $C_ID"
sudo docker exec -it $C_ID sed -i "s/10.233.61.201/$IP/g" /robot/resources/cds_interface.robot
sudo docker commit -m "cds_ip_change" $C_ID registry.gitlab.com/pavansamudrala/xtesting/cds-healthcheck:cds-healthcheck-master-updated
