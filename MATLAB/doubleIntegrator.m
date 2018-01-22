function [dataT,g,data0] = doubleIntegrator()

%% Should we export the final reachable set?
saveData = true;

%% Grid
grid_min = [-10; -5]; % Lower corner of computation domain
grid_max = [ 10;  5];    % Upper corner of computation domain
N = [101; 41];         % Number of grid points per dimension
g = createGrid(grid_min, grid_max, N);
% Use "g = createGrid(grid_min, grid_max, N);" if there are no periodic
% state space dimensions

%% target set
R = 1;
% data0 = shapeCylinder(grid,ignoreDims,center,radius)
% data0 = shapeCylinder(g, 3, [0; 0; 0], R);
data0 = shapeRectangleByCorners(g, [-1; -inf], [1; inf]);
% also try shapeRectangleByCorners, shapeSphere, etc.

%% time vector
t0 = 0;
tMax = 5;
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
dCar = DoubleInt([0, 0], [-wMax,wMax]);

% Put grid and dynamic systems into schemeData
schemeData.grid = g;
schemeData.dynSys = dCar;
schemeData.accuracy = 'high'; %set accuracy
schemeData.uMode = uMode;
%do dStep4 here


%% If you have obstacles, compute them here
%{
obstacles = shapeCylinder(g, 3, [-1.5;-1.5;0], 0.75);
HJIextraArgs.obstacles = obstacles;
%}

%% Compute value function

HJIextraArgs.visualize = true; %show plot
HJIextraArgs.fig_num = 1; %set figure number
HJIextraArgs.deleteLastPlot = true; %delete previous plot as you update

%[data, tau, extraOuts] = ...
% HJIPDE_solve(data0, tau, schemeData, minWith, extraArgs)
[data, tau2, ~] = ...
  HJIPDE_solve(data0, tau, schemeData, 'zero', HJIextraArgs);

if saveData
  json_export_reachset(data(:,:,end),g);
end

dataT = data(:,:,end);
end