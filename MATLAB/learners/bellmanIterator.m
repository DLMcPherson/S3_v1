%% NOTE: This Learner currently assumes the sytem is a 3D Dubins Car system

% Load in the flinch data
%flinches = loadFlinchData('supervisorDavidFlinches1516841518310.dat')
flinches = loadFlinchData('supervisorDavidFlinches1516914792649.dat')

% Load in the initial reachable set (to be modified)
load('../../reachableSets/dubins_reachset.mat');
visualizeLevelSet(g,data,'surface',0,"before adjustment")

% Set the grid values to zero everywhere around each flinch point
flincher = -1
for curFlinch = 1:length(flinches.list)
    flinchState = flinches.list(curFlinch).state;
    for angle = g.min(3):g.dx(3):g.max(3)
        state = flinchState;
        state(1) = flinchState(1)*cos(angle)-flinchState(2)*sin(angle);
        state(2) = flinchState(1)*sin(angle)+flinchState(2)*cos(angle);
        state(3) = angle;
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
end

visualizeLevelSet(g,data,'surface',0,"after flinch placement")
json_export_reachset(data,g,'dubinsPixelwise',"../../reachableSets/");

%% time vector
t0 = 0;
tMax = 2;
dt = 0.05;
tau = t0:dt:tMax;

%% problem parameters

% input bounds
speed = 1;
wMax = 1;

% control trying to min or max value function?
uMode = 'max';


%% Pack problem parameters

% Define dynamic system
% obj = DubinsCar(x, wMax, speed, dMax)
dCar = DubinsCar([0, 0, 0], wMax, speed);

% Put grid and dynamic systems into schemeData
schemeData.grid = g;
schemeData.dynSys = dCar;
schemeData.accuracy = 'high'; %set accuracy
schemeData.uMode = uMode;
%schemeData.dMode = dMode;

%% Compute value function

HJIextraArgs.visualize = true; %show plot
HJIextraArgs.fig_num = 1; %set figure number
HJIextraArgs.deleteLastPlot = true; %delete previous plot as you update

%[data, tau, extraOuts] = ...
% HJIPDE_solve(data0, tau, schemeData, minWith, extraArgs)
[data2, tau2, ~] = ...
  HJIPDE_solve(data, tau, schemeData, 'zero', HJIextraArgs);

json_export_reachset(data2(:,:,:,end),g,'dubinsBI',"../../reachableSets/");