#!/bin/sh

set -eu

BRANCH=${BRANCH:-"master"}
ZIP="${BRANCH}.zip"
URL=${URL:-"https://github.com/cortezaproject/corteza-ext/archive/${ZIP}"}
DIR="corteza-ext-${BRANCH}"
DST=${DST:-"/corredor/corteza-ext"}

download () {
  curl -s --location "${URL}" > "${ZIP}"
  unzip -qq "${ZIP}"
}

copyExtScripts () {
  mkdir -p "${DST}/${1}"
  cp -r "${DIR}/${1}/client-scripts" "${DST}/${1}"
  cp -r "${DIR}/${1}/server-scripts" "${DST}/${1}"
}

cleanup () {
  rm -rf "${ZIP}" "${DIR}"
}

download

copyExtScripts crm
copyExtScripts service-cloud

cleanup

