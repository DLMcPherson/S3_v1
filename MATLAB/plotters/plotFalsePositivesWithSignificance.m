%plotFalsePositivesWithSignificance

% Data Indices
falsePositiveIndex = 11;

makePlotOfResult(datatable, falsePositiveIndex, 'Supervisory False Positives', 'Safe Set', 'Number of False Positives');
sigstar({[0, 1], [0, 2]}, [0.05, 0.01]);