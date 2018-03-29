%flinchValueMatcher.m
%
% Match a set of flinch data to the most likely value function and level set,
% based computing the maximum likelihood level set for each family member,
% and then selecting the family member with the highest induced likelihood

%% Specify parameters
familyDataFile = "../generators/dubinsFamily.mat";
% flinchDataFile = 'autoFlinches.mat';
%flinchDataFile = '/Users/david.mcpherson/Downloads/supervisorFlinches.dat';
participantID = 9;
flinches = loadFlinchData("../../../Experiments/"+participantID+"/supervisorFlinches.dat");
mleSaveFile = "../../../Experiments/"+participantID+"/mleData.mat";

%% Load the flinch data and the family of value functions
familyData = load(familyDataFile);
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
  
  % Find the MAP of the mean
  % (with no support for negative means, this is just the max of the sample mean
  % and zero)
  meanMLE(i) = max(mean(values), 0);
  
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
  %disp(['mean: ', num2str(mean(values)), ', variance: ', num2str(std(values)^2), ', log likelihood: ', num2str(logLikelihoods(i))])
  disp(['mean: ', num2str(meanMLE(i)), ', variance: ', num2str(varianceMLE(i)), ', log likelihood: ', num2str(logLikelihoods(i))])
end

[~, maxLikelihoodIndex] = max(logLikelihoods);

%% Plot the best match by mean
if false
    disp(minAbsMeanIndex)
    plotFlinchesOverValueFromFamily(flinchData, familyData, minAbsMeanIndex, thetaCoordinate);
end

%% Plot the best match by variance
if false
    disp(minVarianceIndex)
    plotFlinchesOverValueFromFamily(flinchData, familyData, minVarianceIndex, thetaCoordinate);
end

%% Plot the maximum likelihood match
if true
    disp(maxLikelihoodIndex)
    disp(meanMLE(maxLikelihoodIndex))
    plotFlinchesOverValueFromFamily(flinchData, familyData, maxLikelihoodIndex, thetaCoordinate);
    %savefig(gcf,"MLESubject"+participantID+".fig")
end

offsetReachset = familyData.valuesFamily{maxLikelihoodIndex} - meanMLE(maxLikelihoodIndex);

json_export_reachset(offsetReachset,familyData.gridDataFamily{maxLikelihoodIndex},'dubinsMLE',"../../reachableSets/");

%% Save MLE data
mu = meanMLE(maxLikelihoodIndex);
sigma2 = varianceMLE(maxLikelihoodIndex);
mleLogLikelihood = logLikelihoods(maxLikelihoodIndex);
omegaMax = familyData.gridDataFamily{maxLikelihoodIndex}.wMax;
save(mleSaveFile, 'mu', 'sigma2', 'mleLogLikelihood', 'omegaMax');

%% Check if the fitted set is less conservative anywhere than the physics-based safe set
physics_set = load('../../reachableSets/dubins_reachset.mat');
less_conservative = any(any(any( (physics_set.data < 0) & (offsetReachset > 0) )))