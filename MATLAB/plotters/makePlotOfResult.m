function makePlotOfResult(datatable, colIndex, plotTitle, plotXLabel, plotYLabel)
% Standard Indices
physicsIndex = 0;
learnedIndex = 1;
conservativeIndex = 2;

[physicsValues, physicsMean, physicsSem] = ...
  extractDataFromTable(datatable, physicsIndex, colIndex);
[learnedValues, learnedMean, learnedSem] = ...
  extractDataFromTable(datatable, learnedIndex, colIndex);
[conservativeValues, conservativeMean, conservativeSem] = ...
  extractDataFromTable(datatable, conservativeIndex, colIndex);

% Plot
meanArray = [physicsMean, learnedMean, conservativeMean];
semArray = [physicsSem, learnedSem, conservativeSem];
figure;
hold on;
% hControl = bar([0, 1, 2], meanArray, 'LineStyle', 'none');
xLocations = [0, 1, 2];
colors = [0.5, 0.5, 0.5; 0.1412, 0.9216, 0.5961; 0.5, 0.5, 0.5];
for i = 1:3
hControl = bar(xLocations(i), meanArray(i), 'LineStyle', 'none', ...
               'FaceColor', colors(i, :));
end
errorbar([0, 1, 2], meanArray, semArray, 'k.', 'LineWidth', 1.5)
% herrorbar(meanArray, [0.85, 1.15; 1.85, 2.15; 2.85, 3.15; 3.85, 4.15], semArray, semArray, 'k.');
% set(gca, 'Ytick', [1, 2, 3, 4]);
% set(gca, 'YtickLabel', {'Hard & Wrong', 'Hard & Right', 'Easy & Wrong', 'Easy & Right'});
% set(gca, 'YtickLabel', {'', '', '', ''});
% legend('HF', 'IM')
set(gca, 'FontSize', 14)
set(gca, 'Xtick', [0, 1, 2]);
set(gca,'TickLabelInterpreter', 'latex');
set(gca, 'XtickLabel', {'Standard', 'Learned', 'Conservative'});
xlabel(plotXLabel, 'interpreter', 'latex', 'FontSize', 16)
ylabel(plotYLabel, 'interpreter', 'latex', 'FontSize', 16)
title(plotTitle, 'interpreter', 'latex', 'FontSize', 18)
set( gca, 'YGrid', 'on' );
% set(gca, 'FontSize', 20)

end