%flinchValueMatcher.m
%
% Match a set of flinch data to the most likely value function and level set,
% based on selecting either the value function that has mean flinch value
% closest to zero, or which has the minimum variance on any level set.

%% Load the flinch data and the family of value functions
familyData = load('dubinsFamily.mat');
flinchData = load('autoFlinches.mat');

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
  
  % Detect minimum values
  if abs(mean(values)) < minAbsMean
    minAbsMean = abs(mean(values));
    minAbsMeanIndex = i;
  end
  if std(values)^2 < minVariance
    minVariance = std(values)^2;
    minVarianceIndex = i;
  end
  disp(['mean: ', num2str(mean(values)), ', variance: ', num2str(std(values)^2)])
end

%% Plot the best match by mean
if true
    % New figure
    figure;
    hold on;
    
    disp(minAbsMeanIndex)
    
    % Use the value function data as background
    gridX = familyData.gridDataFamily{minAbsMeanIndex}.vs{xIndex};
    gridY = familyData.gridDataFamily{minAbsMeanIndex}.vs{yIndex};
    plotValues = ...
      familyData.valuesFamily{minAbsMeanIndex}(:, :, thetaCoordinate);
    image('XData', gridX, 'YData', gridY, ...
          'CData', plotValues','CDataMapping','scaled');
        
    % Show the contour lines
    contour(gridX, gridY, plotValues', ...
            'k', 'LineWidth', 2);
    
    % Plot the flinch points
    plot(flinchData.flinchPoints(1,:), flinchData.flinchPoints(2,:), ...
         'ro', 'LineWidth', 2)
    
    % Label the theta value for this plot
    title(['\theta = ', num2str(gridData.vs{thetaIndex}(thetaCoordinate))]);
    axis equal;
    hold off;
end

%% Plot the best match by variance
if true
    % New figure
    figure;
    hold on;
    
    disp(minVarianceIndex)
    
    % Use the value function data as background
    gridX = familyData.gridDataFamily{minVarianceIndex}.vs{xIndex};
    gridY = familyData.gridDataFamily{minVarianceIndex}.vs{yIndex};
    plotValues = ...
      familyData.valuesFamily{minVarianceIndex}(:, :, thetaCoordinate);
    image('XData', gridX, 'YData', gridY, ...
          'CData', plotValues','CDataMapping','scaled');
        
    % Show the contour lines
    contour(gridX, gridY, plotValues', ...
            'k', 'LineWidth', 2);
    
    % Plot the flinch points
    plot(flinchData.flinchPoints(1,:), flinchData.flinchPoints(2,:), ...
         'ro', 'LineWidth', 2)
    
    % Label the theta value for this plot
    title(['\theta = ', num2str(gridData.vs{thetaIndex}(thetaCoordinate))]);
    axis equal;
    hold off;
end