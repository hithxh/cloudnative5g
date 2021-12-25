#!/bin/sh
set -xe
#USER_BRANCH=$1
apk add git
REPO_SRC_TOP=$(realpath $(dirname "$0")/../..)

build_and_push_image() {
  if [ "$MODULE" = "" ]; then
    exit 1
  fi
  docker build --pull -t "$REPOSITORY"/"$MODULE":"$AMCOP_TAG" .
  echo Pushing "$REPOSITORY"/$MODULE to internal contianer registry with version "$AMCOP_TAG"
  docker push "$REPOSITORY"/$MODULE:"$AMCOP_TAG"

  if [ $BUILD_LATEST_TAG ]; then
    docker build --pull -t "$REPOSITORY"/"$MODULE":"$AMCOP_LATEST_TAG" .
    echo Pushing "$REPOSITORY"/$MODULE to internal contianer registry with version "$AMCOP_LATEST_TAG"
    docker push "$REPOSITORY"/$MODULE:"$AMCOP_LATEST_TAG"
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
  AMCOP_TAG=${AMCOP_TAG:-$RELEASE-$(date +%Y-%m-%d)}
else
  AMCOP_TAG=${AMCOP_TAG:-$(date +%Y-%m-%d)}
fi

AMCOP_LATEST_TAG=""
if [ $BUILD_LATEST_TAG ]; then
  AMCOP_LATEST_TAG="latest"
  if [ "$RELEASE" != "master" ]; then
    AMCOP_LATEST_TAG="$RELEASE-latest"
  fi
fi

echo "USER_BRANCH = $USER_BRANCH"
echo "CI_COMMIT_REF_NAME = $CI_COMMIT_REF_NAME"

git checkout $CI_COMMIT_REF_NAME

git pull

pwd 

git status

git checkout master

git checkout $USER_BRANCH

git status

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

# configsvc
echo Building image for configsvc
cd $REPO_SRC_TOP/awe/src/configsvc
MODULE="configsvc"
build_and_push_image
cd -
