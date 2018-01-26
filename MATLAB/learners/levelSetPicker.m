% Load in the flinch data
%flinches = loadFlinchData('supervisorDavidFlinches1516841518310.dat')
flinches = loadFlinchData('supervisorDavidFlinches1516914792649.dat')

% Load in the initial reachable set (to be modified)
load('../../reachableSets/dubins_reachset.mat');
visualizeLevelSet(g,data,'surface',0,"before adjustment")

% Pick off the value function's value at each flinch state
% and identify the largest one to become the new intervention level-set
maxValue = 0;
for curFlinch = 1:length(flinches.list)
    flinchState = flinches.list(curFlinch).state;
    curValue = interpolateValue(flinchState,g,data);
    if(curValue > maxValue)
        maxValue = curValue
    end
end

% Offset the value function by the picked value
data = data - maxValue;
visualizeLevelSet(g,data,'surface',0,"after adjustment")

function value = interpolateValue(state,grid,griddedFunction)
  eqIndex = (state - grid.min)./grid.dx;
  Index(1,:) = floor(eqIndex);
  Index(2,:) = ceil(eqIndex);
  value = griddedFunction(Index(1,1),Index(1,2),Index(1,3));
end