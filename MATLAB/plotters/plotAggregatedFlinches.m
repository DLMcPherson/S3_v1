flinchData = load("../../../Experiments/flinchDataAggregate.mat");
familyDataFile = '../dubinsFamily.mat';
familyData = load(familyDataFile);
familyIndex = 9;
thetaCoordinate = 22;

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
%image('XData', gridX, 'YData', gridY, ...
%      'CData', plotValues','CDataMapping','scaled');

% Plot the flinch points
for ii = [1:6,8:12]
    % Find which safe set the points are contained in
        % Find the value for each point
    flinches = flinchData.flinchPoints{ii};
    values = [];
    for j = 1 : length(flinches)
        xIndex = 1;
        yIndex = 2;
        thetaIndex = 3;
        % Find grid point corresponding to this state
        [~, xCoordinate] = min(abs(flinches(xIndex, j) ...
                           - familyData.gridDataFamily{familyIndex}.vs{xIndex}));
        [~, yCoordinate] = min(abs(flinches(yIndex, j) ...
                           - familyData.gridDataFamily{familyIndex}.vs{yIndex}));
        [~, thetaCoordinate] = min(abs(flinches(thetaIndex, j) ...
                               - familyData.gridDataFamily{familyIndex}.vs{thetaIndex}));

        % Find the value function at this state
        values(end + 1) = ...
          familyData.valuesFamily{familyIndex}(xCoordinate, yCoordinate, thetaCoordinate);
    end
    containedZero = (values < 0);
    containedCons = (values < 1.8);
    % Plot the points
    plot(flinches(1,:), flinches(2,:), ...
         'o','Color', [0.8 0.8 0.8] , 'LineWidth', 1)
    plot(flinches(1,containedCons), flinches(2,containedCons), ...
         'o','Color', [0.811 0.298 0.204] , 'LineWidth', 1)
    plot(flinches(1,containedZero), flinches(2,containedZero), ...
         'o','Color', [0.298 0.110 0.0745] , 'LineWidth', 1)
end

% Show the contour lines
contour(gridX, gridY, plotValues',[0,1.8], ...
        'Color',[0.811 0.298 0.204], 'LineWidth', 2);
contour(gridX, gridY, plotValues',[0 0], ...
        'Color',[0.298 0.110 0.0745], 'LineWidth', 2);

% Label the theta value for this plot
xlabel('X','interpreter','latex')
ylabel('Y','interpreter','latex')
title('Empirical Distribution of Supervisor Interventions','interpreter','latex')
axis equal;
axis([-8 4 -4 4])
hold off;