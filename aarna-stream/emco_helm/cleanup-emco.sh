if [ $# -ne 1 ]; then
	echo "Usage cleanup-emco.sh <namespace>"
	exit
fi
NS=$1

# To clean up composite vfw demo resources in a cluster
kubectl -n $NS delete deployment clm
kubectl -n $NS delete deployment orchestrator
kubectl -n $NS delete deployment ncm
kubectl -n $NS delete deployment ovnaction
kubectl -n $NS delete deployment dcm
kubectl -n $NS delete deployment rsync
kubectl -n $NS delete service clm
kubectl -n $NS delete service orchestrator
kubectl -n $NS delete service ncm
kubectl -n $NS delete service ovnaction
kubectl -n $NS delete service dcm
kubectl -n $NS delete service rsync
kubectl -n $NS delete configmap clm
kubectl -n $NS delete configmap orchestrator
kubectl -n $NS delete configmap ncm
kubectl -n $NS delete configmap ovnaction
kubectl -n $NS delete configmap dcm
kubectl -n $NS delete configmap rsync
