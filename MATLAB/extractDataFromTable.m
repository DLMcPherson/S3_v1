function [value, mean, sem] = extractDataFromTable(datatable, safeset, colIndex)
rowIndex = findDatatableIndices(datatable, safeset);

[value, mean, sem] = ...
  extractMeanAndSem(datatable, rowIndex, colIndex);
end

function index = findDatatableIndices(datatable, safeset)
index = find(cell2mat(datatable(2:end, 6)) == safeset) + 1;

% strcmp(datatable(:, 2), difficulty) ...
%              .* strcmp(datatable(:, 3), prediction) ...
%              .* strcmp(datatable(:, 4), assistance));
end

function [value, valueMean, valueSem] = extractMeanAndSem(datatable, rowIndex, colIndex)
value = cell2mat(datatable(rowIndex, colIndex));
valueMean = mean(value);
valueSem = std(value)/sqrt(length(value));
end