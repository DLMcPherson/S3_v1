%flinchValueMatcher.m
%
% Match a set of flinch data to the most likely value function and level set,
% based computing the maximum likelihood level set for each family member,
% and then selecting the family member with the highest induced likelihood

%% Load the flinch data and the family of value functions
familyData = load('dubinsFamily.mat');
%flinchData = load('autoFlinches.mat');
flinches = loadFlinchData('/Users/david.mcpherson/Downloads/supervisorFlinches.dat');
flinchData.flinchPoints = matrixifyFlinchData(flinches);

%% Find the best match
familySize = length(familyData.gridDataFamily);
numFlinches = length(flinchData.flinchPoints);

minVariance = inf;
minVarianceIndex = 1;
minAbsMean = inf;
minAbsMeanIndex = 1;
for i = 1 : familySize
  % Determine value of each flinch point for this value function
  values = [];
  for j = 1 : numFlinches
    xIndex = 1;
    yIndex = 2;
    thetaIndex = 3;
    % Find grid point corresponding to this state
    [~, xCoordinate] = min(abs(flinchData.flinchPoints(xIndex, j) ...
                       - familyData.gridDataFamily{i}.vs{xIndex}));
    [~, yCoordinate] = min(abs(flinchData.flinchPoints(yIndex, j) ...
                       - familyData.gridDataFamily{i}.vs{yIndex}));
    [~, thetaCoordinate] = min(abs(flinchData.flinchPoints(thetaIndex, j) ...
                           - familyData.gridDataFamily{i}.vs{thetaIndex}));

    % Find the value function at this state
    values(end + 1) = ...
      familyData.valuesFamily{i}(xCoordinate, yCoordinate, thetaCoordinate);
  end
  
  % Find the MLE of the mean
  % (this turns out to simply be the sample mean)
  meanMLE(i) = mean(values);
  
  % Find the MLE of the variance
  % (a biased estimate of the variance)
  varianceMLE(i) = (1 / numFlinches) * sum((values - meanMLE(i)) .^ 2);
  
  % Find the log-likelihood value for this value function
  logLikelihoods(i) = -(numFlinches / 2) * log(2 * pi * varianceMLE(i))...
                     - sum((values - meanMLE(i)) .^ 2) / (2 * varianceMLE(i));
  
  % Detect minimum values
  if abs(mean(values)) < minAbsMean
    minAbsMean = abs(mean(values));
    minAbsMeanIndex = i;
  end
  if std(values)^2 < minVariance
    minVariance = std(values)^2;
    minVarianceIndex = i;
  end
  disp(['mean: ', num2str(mean(values)), ', variance: ', num2str(std(values)^2), ', log likelihood: ', num2str(logLikelihoods(i))])
end

[~, maxLikelihoodIndex] = max(logLikelihoods);

%% Plot the best match by mean
if true
    disp(minAbsMeanIndex)
    plotFlinchesOverValueFromFamily(flinchData, familyData, minAbsMeanIndex, thetaCoordinate);
end

%% Plot the best match by variance
if true
    disp(minVarianceIndex)
    plotFlinchesOverValueFromFamily(flinchData, familyData, minVarianceIndex, thetaCoordinate);
end

%% Plot the maximum likelihood match
if true
    disp(maxLikelihoodIndex)
    disp(meanMLE(maxLikelihoodIndex))
    plotFlinchesOverValueFromFamily(flinchData, familyData, maxLikelihoodIndex, thetaCoordinate);
end

json_export_reachset(familyData.valuesFamily{maxLikelihoodIndex},familyData.gridDataFamily{maxLikelihoodIndex},'dubinsMLE',"../reachableSets/");