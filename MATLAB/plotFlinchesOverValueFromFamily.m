%plotFlinchesOverValueFromFamily.m
%
% plotFlinchesOverValuesFromFamily()
%
% Generate a plot of flinch locations overlaid on a value function heat map with
% level set curves
%
% Inputs:
%   - flinchData: a struct containing the x, y, and theta coordinates of a set
%     of flinches
%   - familyData: a struct containing grid and value data for representing a
%     family of value functions
%   - familyIndex: the member of the family that should be plotted (i.e. which
%     value function should be used)
%   - thetaCoordinate: based on this coordinate, we determine which 2D
%     projection of the value function should be used

function plotFlinchesOverValueFromFamily(flinchData, familyData, familyIndex, thetaCoordinate)
% Standard Indices
xIndex = 1;
yIndex = 2;
thetaIndex = 3;

% New figure
figure;
hold on;

% Use the value function data as background
gridX = familyData.gridDataFamily{familyIndex}.vs{xIndex};
gridY = familyData.gridDataFamily{familyIndex}.vs{yIndex};
plotValues = ...
  familyData.valuesFamily{familyIndex}(:, :, thetaCoordinate);
image('XData', gridX, 'YData', gridY, ...
      'CData', plotValues','CDataMapping','scaled');

% Show the contour lines
contour(gridX, gridY, plotValues', ...
        'k', 'LineWidth', 2);

% Plot the flinch points
plot(flinchData.flinchPoints(1,:), flinchData.flinchPoints(2,:), ...
     'ro', 'LineWidth', 2)

% Label the theta value for this plot
title(['\theta = ', num2str( ...
  familyData.gridDataFamily{familyIndex}.vs{thetaIndex}(thetaCoordinate))]);
axis equal;
hold off;
    
end