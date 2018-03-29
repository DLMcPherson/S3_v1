%findExcludedFlinches.m

flinchDataFile = '../../../Experiments/flinchDataAggregate.mat';

flinchData = load(flinchDataFile);
flinchData.flinchPoints = flinchData.flinchPoints([1:6, 8:12]);

omegaIndex = 9;
mu = 1.8;

totalFlinches = 0;
includedFlinches = 0;
for i = 1 : length(flinchData.flinchPoints)
  % Determine value of each flinch point for this value function
  values = [];
  numFlinches = size(flinchData.flinchPoints{i}, 2);
  totalFlinches = totalFlinches + numFlinches;
  for j = 1 : numFlinches
    xIndex = 1;
    yIndex = 2;
    thetaIndex = 3;
    % Find grid point corresponding to this state
    [~, xCoordinate] = min(abs(flinchData.flinchPoints{i}(xIndex, j) ...
                       - familyData.gridDataFamily{omegaIndex}.vs{xIndex}));
    [~, yCoordinate] = min(abs(flinchData.flinchPoints{i}(yIndex, j) ...
                       - familyData.gridDataFamily{omegaIndex}.vs{yIndex}));
    [~, thetaCoordinate] = min(abs(flinchData.flinchPoints{i}(thetaIndex, j) ...
                           - familyData.gridDataFamily{omegaIndex}.vs{thetaIndex}));

    % Find the value function at this state
    values(end + 1) = ...
      familyData.valuesFamily{omegaIndex}(xCoordinate, yCoordinate, thetaCoordinate);
    if values(end) <= mu
      includedFlinches = includedFlinches + 1;
    end
  end
end