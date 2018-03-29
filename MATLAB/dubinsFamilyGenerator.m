%dubinsFamilyGenerator.m
%
% Generates a family of Dubins-car-dynamics-based reachable sets with varying
% values for the maximum turning rate. These reachable sets will represent
% hypotheses for how a human operator perceives the dynamics of the vehicle.

%% Set the parameters for this family
% Omega values
wFamily = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
sigFamily = [0, 0.25, 0.5, 0.75, 1.0];

wFamily = [0.7];
sigFamily = [0, 0.5, 1];

% Save the results
saveFamily = true;

%% Generate the Dubins rechable set family
gridDataFamily = {};
valuesFamily = {};
for i = 1 : length(wFamily)
    for jj = 1 : length(sigFamily)
      [gridData, values] = dubinsGenerator(wFamily(i),sigFamily(jj));

      gridDataFamily(end + 1) = {gridData};
      valuesFamily(end + 1) = {values(:,:,:,end)};
    end
end

%% Save the family data, if desired
if saveFamily
  save('dubinsFamily.mat', 'gridDataFamily', 'valuesFamily');
end