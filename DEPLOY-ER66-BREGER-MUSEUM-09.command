#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy --only hosting:eternalroute66,hosting:breger,hosting:tempo --project shareshuffle-c7f96
open -a Safari "https://eternalroute66.com/?museum=20260714T171217Z"
open -a Safari "https://butchbreger.com/?museum=20260714T171217Z"
open -a Safari "https://tempofoundry.com/?museum=20260714T171217Z"
