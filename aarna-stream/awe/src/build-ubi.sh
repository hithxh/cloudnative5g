#!/bin/sh
set -xe

REPO_SRC_TOP=$(realpath $(dirname "$0")/../..)

build_and_push_image() {
  if [ "$MODULE" = "" ]; then
    exit 1
  fi
  docker build --pull -t "$REPOSITORY"/"$MODULE":"$AMCOP_TAG" -f Dockerfile.ubi .
  echo Pushing "$REPOSITORY"/$MODULE to internal contianer registry with version "$AMCOP_TAG"
  #docker push "$REPOSITORY"/$MODULE:"$AMCOP_TAG"

  if [ $BUILD_LATEST_TAG ]; then
    docker build --pull -t "$REPOSITORY"/"$MODULE":"$AMCOP_LATEST_TAG" -f Dockerfile.ubi .
    echo Pushing "$REPOSITORY"/$MODULE to internal contianer registry with version "$AMCOP_LATEST_TAG"
    #docker push "$REPOSITORY"/$MODULE:"$AMCOP_LATEST_TAG"
  fi
  MODULE="" #reset module variable for next incarnation
}

BUILD_LATEST_TAG=false
if [ "$AMCOP_TAG" = "" ]; then
  BUILD_LATEST_TAG=true
fi

REPOSITORY=${REPOSITORY:-amcopnightly}
RELEASE=${RELEASE:-master}
if [ "$RELEASE" != "master" ]; then
  AMCOP_TAG=${AMCOP_TAG:-$RELEASE-$(date +%Y-%m-%d)-ubi}
else
  AMCOP_TAG=${AMCOP_TAG:-$(date +%Y-%m-%d)-ubi}
fi

AMCOP_LATEST_TAG=""
if [ $BUILD_LATEST_TAG ]; then
  AMCOP_LATEST_TAG="latest-ubi"
  if [ "$RELEASE" != "master" ]; then
    AMCOP_LATEST_TAG="$RELEASE-latest-ubi"
  fi
fi

echo Building AMCOP images with version "$AMCOP_TAG"
# build emcoui
echo Building image for emcoui
cd $REPO_SRC_TOP/onap4k8s-ui
MODULE="emcoui"
build_and_push_image
cd -

# middle end
echo Building image for middleend
cd $REPO_SRC_TOP/awe/src/guimiddleend
MODULE="middleend"
build_and_push_image
cd -
