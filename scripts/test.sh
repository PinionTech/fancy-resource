#!/bin/bash

BASE_DIR=`dirname $0`
CONFIG=$BASE_DIR/../config/testacular-unit.conf.js

echo ""
echo "Starting Testacular Unit Server"
echo "Using config '$CONFIG'"
echo "-------------------------------"

testacular start $CONFIG $*
