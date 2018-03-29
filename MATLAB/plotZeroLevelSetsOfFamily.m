%plotZeroLevelSetsOfFamily

%% Specify parameters
familyDataFile = 'dubinsFamily.mat';

%% Load the flinch data and the family of value functions
familyData = load(familyDataFile);

% Standard Indices
xIndex = 1;
yIndex = 2;
thetaIndex = 3;
thetaCoordinate = 22;
%thetaCoordinate = 42;

% New figure
figure;
hold on;

% Draw the keep out set
kPos = [-1.8 -1.8 3.6 3.6]; 
rectangle('Position',kPos,'Curvature',[1 1], 'FaceColor',[0 0 0])


% Use the value function data as background
colorMapping = parula(length(familyData.valuesFamily));
for familyIndex = [1:length(familyData.valuesFamily)]
  gridX = familyData.gridDataFamily{familyIndex}.vs{xIndex};
  gridY = familyData.gridDataFamily{familyIndex}.vs{yIndex};
  plotValues = ...
    familyData.valuesFamily{familyIndex}(:, :, thetaCoordinate);
%   image('XData', gridX, 'YData', gridY, ...
%         'CData', plotValues','CDataMapping','scaled');

  % Show the contour lines [0.2, 0.5, 0.8]
  contour(gridX, gridY, plotValues', [0.7, 0.7], ...
          'color', colorMapping(length(familyData.valuesFamily) - familyIndex + 1, :), 'LineWidth', 2);
  
  %familyData.gridDataFamily{familyIndex}.sigma = mod(familyIndex-1,5)*0.25;
  wMax{familyIndex} = ['$$\omega_{max} = ', num2str(familyData.gridDataFamily{familyIndex}.wMax), ', \sigma = ', num2str(familyData.gridDataFamily{familyIndex}.sigma),'$$'];
%   % Plot the flinch points
%   plot(flinchData.flinchPoints(1,:), flinchData.flinchPoints(2,:), ...
%        'ro', 'LineWidth', 2)
end

% Label the theta value for this plot
% title(['\omega_{max} = ', num2str( ...
%   familyData.gridDataFamily{familyIndex}.wMax)]);
set(gca, 'FontSize', 14)
set(gca,'TickLabelInterpreter', 'latex');
title('Zero Level Sets ($$\theta = 0$$)', 'interpreter', 'latex', 'FontSize', 18);
legend(wMax, 'interpreter', 'latex', 'FontSize', 14);
axis equal;
ylim([-4 4]);
ylabel('$$y$$', 'interpreter', 'latex','FontSize', 16)
xlabel('$$x$$', 'interpreter', 'latex','FontSize', 16)
grid on;
hold off;