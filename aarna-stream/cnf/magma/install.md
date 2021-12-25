Steps to install magma

1. Enable AMCOP storage class
2. Install magma helm chart
   helm install orc8r --create-namespace --namespace magma ./magma-0.1.0.tgz
3. enable admin keys
   kubectl exec -it -n magma $(kubectl get pod -n magma -l app.kubernetes.io/component=certifier  -o jsonpath='{.items[0].metadata.name}') --     /var/opt/magma/bin/accessc add-existing -admin -cert /var/opt/magma/certs/admin_operator.pem admin_operator
4. enable nms user/password
   kubectl -n magma exec -it $(kubectl --namespace magma get pod -l  app.kubernetes.io/component=magmalte -o jsonpath='{.items[0].metadata.name}') -- yarn setAdminPassword master prabhjot@aarnanetworks.com password1234
