offset = 5;
filename = 'dubins';
load(strcat('../reachableSets/',filename,'_reachset.mat'));

% Offset the value function by the picked value
data = data - offset;
json_export_reachset(data,g,strcat(filename,'Widened'));