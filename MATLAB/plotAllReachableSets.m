%plotAllReachableSets.m

% Standard Indices
physicsIndex = 0;
learnedIndex = 1;
conservativeIndex = 2;

% Data Indices
omegaIndex = 29;
muIndex = 30;

wFamily = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.5, 2, 2.5, 3];

familyData = load(familyDataFile);

[omegaValues, ~, ~] = extractDataFromTable(datatable, learnedIndex, omegaIndex);
omegaValues = omegaValues(1:2:end);
[muValues, ~, ~] = extractDataFromTable(datatable, learnedIndex, muIndex);
muValues = muValues(1:2:end);

% New figure
colorMapping = lines(length(omegaValues));
% redColor = [1, 0.45, 0.35];
redColor = [0.81, 0.298, 0.204];
figure;
hold on;

% Draw the keep out set
kPos = [-1.8 -1.8 3.6 3.6]; 
rectangle('Position',kPos,'Curvature',[1 1], 'FaceColor',[0 0 0])
for i = 1:length(omegaValues)
  familyIndex = find(wFamily == omegaValues(i));
  
  % Standard Indices
  xIndex = 1;
  yIndex = 2;
  thetaIndex = 3;

  % Use the value function data as background
  gridX = familyData.gridDataFamily{familyIndex}.vs{xIndex};
  gridY = familyData.gridDataFamily{familyIndex}.vs{yIndex};
  plotValues = ...
    familyData.valuesFamily{familyIndex}(:, :, thetaCoordinate);
%   image('XData', gridX, 'YData', gridY, ...
%         'CData', plotValues','CDataMapping','scaled');

  % Show the contour lines
%   contour(gridX, gridY, plotValues', [muValues(i) muValues(i)], ...
%           'color', colorMapping(i, :), 'LineWidth', 1);
  [~, learnH] = contour(gridX, gridY, plotValues', [muValues(i) muValues(i)], ...
          'color', redColor, 'LineWidth', 1);

%   % Plot the flinch points
%   plot(flinchData.flinchPoints(1,:), flinchData.flinchPoints(2,:), ...
%        'ro', 'LineWidth', 2)

%   % Label the theta value for this plot
%   title(['\omega_{max} = ', num2str( ...
%     familyData.gridDataFamily{familyIndex}.wMax)]);
  axis equal;
%   hold off;
end

% Draw the manually generated sets
omegaValues = [1, 1];
muValues = [0, 1.8];
for i = 1:length(omegaValues)
  familyIndex = find(wFamily == omegaValues(i));
  
  % Standard Indices
  xIndex = 1;
  yIndex = 2;
  thetaIndex = 3;

  % Use the value function data as background
  gridX = familyData.gridDataFamily{familyIndex}.vs{xIndex};
  gridY = familyData.gridDataFamily{familyIndex}.vs{yIndex};
  plotValues = ...
    familyData.valuesFamily{familyIndex}(:, :, thetaCoordinate);
%   image('XData', gridX, 'YData', gridY, ...
%         'CData', plotValues','CDataMapping','scaled');

  % Show the contour lines
  [~, baselineH] = contour(gridX, gridY, plotValues', [muValues(i) muValues(i)], ...
          'color', [0, 0, 0], 'LineWidth', 5);

%   % Plot the flinch points
%   plot(flinchData.flinchPoints(1,:), flinchData.flinchPoints(2,:), ...
%        'ro', 'LineWidth', 2)

  axis equal;
%   hold off;
end
legendStrings{1} = 'Learned';
legendStrings{2} = 'Baseline';

set(gca, 'FontSize', 14)
set(gca,'TickLabelInterpreter', 'latex');
title('Learned vs. Baseline Level Sets', 'interpreter', 'latex', 'FontSize', 18);
legend([learnH, baselineH], legendStrings, 'interpreter', 'latex', 'FontSize', 14);
axis equal;
ylim([-6 6]);
ylabel('$$y$$', 'interpreter', 'latex','FontSize', 16)
xlabel('$$x$$', 'interpreter', 'latex','FontSize', 16)
grid on;
hold off;