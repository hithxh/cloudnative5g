if [ $# -ne 1 ]; then
	echo "Usage cleanup-emco.sh <namespace>"
	exit
fi
NS=$1

# To clean up composite vfw demo resources in a cluster
kubectl -n $NS delete deployment mongo 
kubectl -n $NS delete deployment etcd 
