# SupervisorSafeSetsV0
This is an interactive demo for the project "Learning Supervisor Safe Sets from Interventions to Decrease Cognitive Strain".

# Data File System
Executing the Team Task validation phase (Phase 3) of the experiment requires a configuration file.
This configuration file must be placed in a folder path (referenced from this git repo) at "../Experiments/10/config.js" (where the number 10 can be replaced with any Participant Number).
Note that this same folder ("../Experiments/10/") should also contain the downloaded game telemetry if you want to play it back using the Playback script in "stagePages/Playback3".

This folder directory structure is not included in the repo to discourage uploading the associated user data to any public repository (which would fail our duty to participant privacy and ownership of their own data).

## Local execution
This script can be run locally on your computer by navigating your terminal to the directory containing this repo and executing:
browser-sync start --server --files '**/*.*'
