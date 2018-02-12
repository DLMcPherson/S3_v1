% Load in the flinch data
%flinches = loadFlinchData('supervisorDavidFlinches1516841518310.dat')
flinches = loadFlinchData('supervisorDavidFlinches1516914792649.dat')

% Load in the initial reachable set (to be modified)
load('../../reachableSets/dubins_reachset.mat');
visualizeLevelSet(g,data,'surface',0,"before adjustment")

% Set the grid values to zero everywhere around each flinch point
flincher = 0
for curFlinch = 1:length(flinches.list)
    flinchState = flinches.list(curFlinch).state;
    state = flinchState;
    eqIndex = ((state - g.min) ./ g.dx) + 1;
    loIndex = floor(eqIndex);
    hiIndex = ceil(eqIndex);
    data(loIndex(1),loIndex(2),loIndex(3)) = flincher;
    data(loIndex(1),loIndex(2),hiIndex(3)) = flincher;
    data(loIndex(1),hiIndex(2),loIndex(3)) = flincher;
    data(loIndex(1),hiIndex(2),hiIndex(3)) = flincher;
    data(hiIndex(1),loIndex(2),loIndex(3)) = flincher;
    data(hiIndex(1),loIndex(2),hiIndex(3)) = flincher;
    data(hiIndex(1),hiIndex(2),loIndex(3)) = flincher;
    data(hiIndex(1),hiIndex(2),hiIndex(3)) = flincher;
end

visualizeLevelSet(g,data,'surface',0,"after flinch placement")