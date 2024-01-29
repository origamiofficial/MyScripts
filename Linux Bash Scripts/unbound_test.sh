#!/usr/bin/env bash

# Run the first command and check for SERVFAIL status
dig fail01.dnssec.works @127.0.0.1 -p 5335 | grep -q SERVFAIL
if [[ $? -eq 0 ]]; then
  echo "First test passed [SERVFAIL]"
else
  echo "First test failed: Expected [SERVFAIL]"
  exit 1
fi

# Run the second command and check for NOERROR status
dig dnssec.works @127.0.0.1 -p 5335 | grep -q NOERROR
if [[ $? -eq 0 ]]; then
  echo "Second test passed [NOERROR]"
else
  echo "Second test failed: Expected [NOERROR]"
  exit 1
fi

# Run the third command and check for IP address
dig dnssec.works @127.0.0.1 -p 5335 | grep -q '\b[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\b'
if [[ $? -eq 0 ]]; then
  echo "Third test passed [IP Address]"
else
  echo "Third test failed: Expected [IP Address]"
  exit 1
fi

echo "All test passed: Unbound Working Correctly."
