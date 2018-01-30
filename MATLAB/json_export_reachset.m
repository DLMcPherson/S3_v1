function json_export_reachset(data,g,filename,infoldername)

    % Mange default argument for folder to save in
    if(nargin > 3)
        foldername = infoldername;
    else
        foldername = "../reachableSets/";
    end
    
    % Identify which axes are periodic
    bdrySize=size(g.bdry);
    for ii = 1:bdrySize(1)
      periodicityVec(ii) = isequal(g.bdry(ii),{@addGhostPeriodic});
    end

    % Save reachset value function to JSON along with grid data
    fileID = fopen(foldername+filename+"_reachset.json","w");
    TEXT = jsonencode(data);
    fprintf(fileID,'{ \n');
    fprintf(fileID,'"gdim" : %s \n',jsonencode(g.dim));
    fprintf(fileID,',"gmin" : %s \n',jsonencode(g.min));
    fprintf(fileID,',"gmax" : %s \n',jsonencode(g.max));
    fprintf(fileID,',"gN" : %s \n',jsonencode(g.N));
    fprintf(fileID,',"gdx" : %s \n',jsonencode(g.dx));
    fprintf(fileID,',"gperiodicity" : %s \n',jsonencode(periodicityVec));
    fprintf(fileID,',"data" : %s \n',TEXT);
    fprintf(fileID,'}');
    fclose(fileID);
    
    % Backup reachset value function and grid data struct to MATLAB file
    save(foldername+filename+"_reachset.mat",'data','g');

end