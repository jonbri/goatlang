#!/bin/bash

curl -OL https://golang.org/dl/go1.16.7.linux-amd64.tar.gz --output-dir /tmp
sudo tar -C /usr/local -xvf /tmp/go1.16.7.linux-amd64.tar.gz
export PATH=/usr/local/go/bin:$PATH

